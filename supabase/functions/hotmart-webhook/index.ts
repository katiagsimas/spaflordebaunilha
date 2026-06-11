import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'
import { escapeHtml } from '../_shared/escapeHtml.ts'

/**
 * Hotmart Webhook v2.0 — Provisiona e gerencia usuários automaticamente.
 * Eventos tratados:
 *   - PURCHASE_APPROVED / PURCHASE_COMPLETE → cria/ativa usuário
 *   - PURCHASE_CANCELED / PURCHASE_REFUNDED / PURCHASE_CHARGEBACK → desativa usuário
 *   - SUBSCRIPTION_CANCELLATION → desativa usuário
 *   - PURCHASE_DELAYED / PURCHASE_PROTEST → ignora (não altera estado)
 *   - SWITCH_PLAN → atualiza plano
 */

/**
 * Resolve o plano a partir do productId Hotmart.
 *
 * Ordem de matching:
 *   1. (product_id + offer_code) exato — produtos com múltiplas ofertas (ex.: Business mensal/anual).
 *   2. (product_id) com offer_code NULL — produtos de oferta única (ex.: Caixa Lite).
 *   3. Fallback legado por palavras-chave no nome (compatibilidade).
 *
 * Retorna null se nada casar — o webhook ignora o evento para evitar provisionar
 * acesso indevido (ex.: Imersão R$97, infoprodutos avulsos).
 */
async function resolverPlano(
  supabaseAdmin: ReturnType<typeof createClient>,
  productId: string,
  offerCode: string | null,
  planName: string | null
): Promise<{ planoId: string; planoTipo: string; source: 'productId+offer' | 'productId' | 'fallback' } | null> {
  const nome = (planName || '').toLowerCase()
  console.log('resolverPlano - input:', { productId, offerCode, planName, nomeLower: nome })

  if (productId) {
    // 1) Match exato (product_id + offer_code)
    if (offerCode) {
      const { data: produtoOferta, error: errOferta } = await supabaseAdmin
        .from('hotmart_produtos')
        .select('plano_id, plano_tipo, ativo')
        .eq('product_id', productId)
        .eq('offer_code', offerCode)
        .maybeSingle()

      if (errOferta) {
        console.error('Erro ao consultar hotmart_produtos (product+offer):', errOferta)
      } else if (produtoOferta) {
        if (!produtoOferta.ativo) {
          console.log('resolverPlano - product+offer encontrado mas inativo:', productId, offerCode)
          return null
        }
        console.log('resolverPlano - match exato product+offer:', productId, offerCode, '→', produtoOferta.plano_id, produtoOferta.plano_tipo)
        return { planoId: produtoOferta.plano_id, planoTipo: produtoOferta.plano_tipo, source: 'productId+offer' }
      }
    }

    // 2) Match por produto sem oferta específica (offer_code IS NULL)
    const { data: produto, error } = await supabaseAdmin
      .from('hotmart_produtos')
      .select('plano_id, plano_tipo, ativo')
      .eq('product_id', productId)
      .is('offer_code', null)
      .maybeSingle()

    if (error) {
      console.error('Erro ao consultar hotmart_produtos (product NULL offer):', error)
    } else if (produto) {
      if (!produto.ativo) {
        console.log('resolverPlano - productId encontrado (sem oferta) mas inativo:', productId)
        return null
      }
      console.log('resolverPlano - match por productId (offer NULL):', productId, '→', produto.plano_id, produto.plano_tipo)
      return { planoId: produto.plano_id, planoTipo: produto.plano_tipo, source: 'productId' }
    }
  }

  // 3) Fallback: palavras-chave no nome (apenas para produtos não cadastrados)
  console.log('resolverPlano - productId/offer não cadastrados, usando fallback por nome')
  const isNegocio = nome.includes('business') || nome.includes('negocio') || nome.includes('negócio') || nome.includes('caixa business')
  const isLiteFallback = nome.includes('caixa lite') || nome.includes('caixa de açúcar lite') || nome.includes('caixa de acucar lite')

  if (!isNegocio && !isLiteFallback) {
    console.log('resolverPlano - nome não reconhecido, rejeitando para evitar provisionamento indevido')
    return null
  }

  const planoId = isNegocio ? 'negocio' : 'base'

  if (planoId === 'base') {
    return { planoId, planoTipo: 'anual', source: 'fallback' }
  }

  const isAnual = nome.includes('anual') || nome.includes('annual') || nome.includes('yearly')
  const planoTipo = isAnual ? 'anual' : 'mensal'

  return { planoId, planoTipo, source: 'fallback' }
}

function calcularPlanoFim(planoInicio: string, planoTipo: string): string {
  const inicio = new Date(planoInicio + 'T00:00:00')
  const diasMap: Record<string, number> = { 'anual': 365, 'mensal': 30 }
  const dias = diasMap[planoTipo] ?? 365
  inicio.setDate(inicio.getDate() + dias)
  return inicio.toISOString().split('T')[0]
}

function extrairHottok(req: Request, body: Record<string, unknown>): string | null {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get('hottok')
  const fromHeader = req.headers.get('x-hotmart-hottok')
  const fromBody = (body.hottok as string) || null
  console.log('Hottok sources - query:', !!fromQuery, '| header:', !!fromHeader, '| body:', !!fromBody)
  return fromQuery || fromHeader || fromBody || null
}

function extrairEmail(data: Record<string, unknown>): string | null {
  const buyer = (data.buyer || {}) as Record<string, unknown>
  const subscriber = (data.subscriber || {}) as Record<string, unknown>
  const subscription = (data.subscription || {}) as Record<string, unknown>
  const subscriptionUser = (subscription.user || {}) as Record<string, unknown>
  const email = (buyer.email || subscriber.email || subscriptionUser.email) as string | undefined
  return email?.toLowerCase()?.trim() || null
}

function extrairNome(data: Record<string, unknown>): string | null {
  const buyer = (data.buyer || {}) as Record<string, unknown>
  const subscriber = (data.subscriber || {}) as Record<string, unknown>
  return (buyer.name || subscriber.name || null) as string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Hotmart Webhook - Início ===')

  try {
    const hottok = Deno.env.get('HOTMART_HOTTOK')
    if (!hottok) {
      console.error('HOTMART_HOTTOK não configurado')
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const body = await req.json()

    const receivedHottok = extrairHottok(req, body)
    if (receivedHottok !== hottok) {
      console.error('Hottok inválido. Recebido:', receivedHottok ? '[presente mas incorreto]' : '[ausente]')
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const event = body.event
    const data = (body.data || {}) as Record<string, unknown>
    const purchase = (data.purchase || {}) as Record<string, unknown>
    const subscription = (data.subscription || {}) as Record<string, unknown>
    const product = (data.product || {}) as Record<string, unknown>
    const plan = (subscription.plan || {}) as Record<string, unknown>

    const email = extrairEmail(data)
    if (!email) {
      console.error('Email do comprador ausente')
      return new Response(
        JSON.stringify({ error: 'Email do comprador ausente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const buyerName = extrairNome(data)
    console.log('Evento:', event, '| Email:', email, '| Produto:', product.name)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // === EVENTOS DE ATIVAÇÃO ===
    if (['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'].includes(event)) {
      const offer = (purchase.offer || {}) as Record<string, unknown>
      const transactionId = (purchase.transaction as string | undefined)?.toString().trim() || null

      // Idempotência: se a transaction Hotmart já foi processada, ignorar reenvios
      if (transactionId) {
        const { data: jaProcessada } = await supabaseAdmin
          .from('historico_planos')
          .select('id')
          .ilike('observacao', `%tx:${transactionId}%`)
          .limit(1)
          .maybeSingle()
        if (jaProcessada) {
          console.log('=== Hotmart Webhook - Transaction já processada, ignorando reenvio ===', transactionId)
          return new Response(
            JSON.stringify({ success: true, event, action: 'duplicate_ignored', transaction: transactionId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }

      // Concatenar todos os campos possíveis para maximizar detecção de palavras-chave
      const planNameParts = [
        plan.name,
        offer.key,
        offer.name,
        offer.code,
        product.name,
      ].filter(Boolean).map(String)
      const planName = planNameParts.join(' | ')
      console.log('planName sources:', planNameParts)
      const offerCode = (offer.code as string | undefined)?.toString().trim() || null
      console.log('offer.code:', offerCode)
      const resolved = await resolverPlano(supabaseAdmin, product.id?.toString() || '', offerCode, planName)
      if (!resolved) {
        console.log('=== Hotmart Webhook - Produto não reconhecido, evento ignorado ===', { productId: product.id, planName })
        return new Response(
          JSON.stringify({ success: true, event, action: 'ignored_unknown_product', productId: product.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      const { planoId, planoTipo } = resolved
      const planoInicio = new Date().toISOString().split('T')[0]
      const planoFim = calcularPlanoFim(planoInicio, planoTipo)

      console.log('Provisionando usuário:', { planoId, planoTipo, planoInicio, planoFim })

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = authUsers.users?.find(u => u.email === email)

      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, ativo, plano_id, plano_tipo, plano_fim')
        .eq('email', email)
        .single()

      const hojeISO = planoInicio
      const planoFields = {
        plano_id: planoId,
        plano_tipo: planoTipo,
        plano_inicio: planoInicio,
        plano_fim: planoFim,
        origem_criacao: 'webhook',
      }
      const planoAnterior = existingProfile?.plano_id ?? null
      const planoTipoAnterior = existingProfile?.plano_tipo ?? null
      const planoFimAnterior = existingProfile?.plano_fim ?? null
      const ativoAnterior = existingProfile?.ativo ?? false
      const aindaVigente = !!planoFimAnterior && planoFimAnterior >= hojeISO

      // Classifica o evento para decidir como atualizar o perfil e quais e-mails enviar
      type TipoEvento =
        | 'upgrade'
        | 'downgrade_agendado'
        | 'renovacao'
        | 'reativacao'
        | 'criacao'

      let tipoEvento: TipoEvento = 'criacao'
      if (existingUser && existingProfile) {
        if (!ativoAnterior || !aindaVigente) {
          tipoEvento = 'reativacao'
        } else if (planoAnterior === 'base' && planoId === 'negocio') {
          tipoEvento = 'upgrade'
        } else if (planoAnterior === 'negocio' && planoId === 'base') {
          tipoEvento = 'downgrade_agendado'
        } else if (planoAnterior === planoId) {
          tipoEvento = 'renovacao'
        }
      }

      // Calcula plano_fim efetivo conforme o tipo do evento
      // - renovação simples / upgrade: estende a partir do plano_fim atual (não perde dias)
      // - downgrade: NÃO sobrescreve plano atual; só agenda
      // - demais: hoje + duração
      let planoFimEfetivo = planoFim
      if (tipoEvento === 'renovacao' || tipoEvento === 'upgrade') {
        const base = aindaVigente && planoFimAnterior ? planoFimAnterior : hojeISO
        planoFimEfetivo = calcularPlanoFim(base, planoTipo)
      }

      // Datas do plano pendente (apenas para downgrade agendado)
      const pendenteInicio = aindaVigente && planoFimAnterior
        ? (() => { const d = new Date(planoFimAnterior + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()
        : hojeISO
      const pendenteFim = calcularPlanoFim(pendenteInicio, planoTipo)

      let userId: string

      if (existingUser && existingProfile) {
        userId = existingUser.id

        if (tipoEvento === 'downgrade_agendado') {
          // Mantém Business ativo até planoFimAnterior; Lite entra depois via cron
          await supabaseAdmin
            .from('profiles')
            .update({
              nome_completo: buyerName || undefined,
              plano_pendente_id: planoId,
              plano_pendente_tipo: planoTipo,
              plano_pendente_inicio: pendenteInicio,
              plano_pendente_fim: pendenteFim,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          await enviarEmailMudancaPlanoAluna(email, buyerName, 'downgrade_agendado', {
            planoAnterior, planoNovo: planoId, planoFimAnterior, pendenteInicio, pendenteFim,
          })
          await enviarEmailMudancaPlanoAdmin(email, buyerName, 'downgrade_agendado', {
            planoAnterior, planoNovo: planoId, planoFimAnterior, pendenteInicio, pendenteFim,
            origemHotmart: `${product.id ?? ''}/${offerCode ?? ''}`,
          })
        } else {
          // Aplica plano imediatamente
          await supabaseAdmin
            .from('profiles')
            .update({
              ativo: true,
              nome_completo: buyerName || undefined,
              primeiro_acesso: tipoEvento === 'reativacao'
                ? (existingProfile.ativo === false)
                : false,
              plano_id: planoId,
              plano_tipo: planoTipo,
              plano_inicio: planoInicio,
              plano_fim: planoFimEfetivo,
              origem_criacao: 'webhook',
              // Limpa qualquer plano pendente anterior (upgrade cancela downgrade agendado)
              plano_pendente_id: null,
              plano_pendente_tipo: null,
              plano_pendente_inicio: null,
              plano_pendente_fim: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          if (tipoEvento === 'upgrade' || tipoEvento === 'renovacao') {
            await enviarEmailMudancaPlanoAluna(email, buyerName, tipoEvento, {
              planoAnterior, planoNovo: planoId, planoFimNovo: planoFimEfetivo,
            })
            await enviarEmailMudancaPlanoAdmin(email, buyerName, tipoEvento, {
              planoAnterior, planoNovo: planoId, planoFimNovo: planoFimEfetivo,
              origemHotmart: `${product.id ?? ''}/${offerCode ?? ''}`,
            })
          } else if (tipoEvento === 'reativacao') {
            await enviarEmailBoasVindas(email, buyerName, planoId)
          }
        }

        console.log('Usuário existente atualizado:', userId, `(${tipoEvento})`)
      } else if (existingUser && !existingProfile) {
        userId = existingUser.id
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email,
            nome_completo: buyerName || null,
            ativo: true,
            primeiro_acesso: true,
            ...planoFields,
          })

        await enviarEmailBoasVindas(email, buyerName, planoId)
        console.log('Perfil criado para usuário existente:', userId)
      } else {
        // Novo usuário - criar com senha temporária
        const senhaTemporaria = crypto.randomUUID()

        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: senhaTemporaria,
          email_confirm: true,
          user_metadata: { nome_completo: buyerName || null }
        })

        if (createError || !createData.user) {
          console.error('Erro ao criar usuário:', createError)
          throw new Error(createError?.message || 'Erro ao criar usuário')
        }

        userId = createData.user.id
        console.log('Novo usuário criado:', userId)

        await new Promise(resolve => setTimeout(resolve, 2000))

        await supabaseAdmin
          .from('profiles')
          .update({ primeiro_acesso: true, ...planoFields })
          .eq('id', userId)

        await enviarEmailBoasVindas(email, buyerName, planoId)
      }

      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'user' }, { onConflict: 'user_id,role' })

      // Record plan history
      const observacaoBits: string[] = []
      if (tipoEvento === 'downgrade_agendado') observacaoBits.push(`Downgrade agendado para ${pendenteInicio}`)
      if (tipoEvento === 'upgrade') observacaoBits.push(`Upgrade ${planoAnterior} → ${planoId}`)
      if (tipoEvento === 'renovacao') observacaoBits.push(`Renovação ${planoId}`)
      if (transactionId) observacaoBits.push(`tx:${transactionId}`)

      await supabaseAdmin.from('historico_planos').insert({
        user_id: userId,
        plano_anterior: planoAnterior,
        plano_tipo_anterior: planoTipoAnterior,
        plano_novo: planoId,
        plano_tipo_novo: planoTipo,
        plano_inicio: tipoEvento === 'downgrade_agendado' ? pendenteInicio : planoInicio,
        plano_fim: tipoEvento === 'downgrade_agendado' ? pendenteFim : planoFimEfetivo,
        tipo_evento: tipoEvento,
        origem: 'webhook',
        observacao: observacaoBits.length ? observacaoBits.join(' | ') : null,
      })


      console.log('=== Hotmart Webhook - Usuário provisionado ===')
      return new Response(
        JSON.stringify({ success: true, user: { id: userId }, event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // === EVENTOS DE DESATIVAÇÃO ===
    if ([
      'PURCHASE_CANCELED',
      'PURCHASE_REFUNDED',
      'PURCHASE_CHARGEBACK',
      'SUBSCRIPTION_CANCELLATION'
    ].includes(event)) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        // Get current plan for history
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('plano_id, plano_tipo, plano_inicio, plano_fim')
          .eq('id', profile.id)
          .single()

        await supabaseAdmin
          .from('profiles')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', profile.id)

        // Record cancellation history
        await supabaseAdmin.from('historico_planos').insert({
          user_id: profile.id,
          plano_anterior: currentProfile?.plano_id,
          plano_tipo_anterior: currentProfile?.plano_tipo,
          plano_inicio: currentProfile?.plano_inicio,
          plano_fim: currentProfile?.plano_fim,
          tipo_evento: 'cancelamento',
          origem: 'webhook',
          observacao: `Evento: ${event}`,
        })

        console.log('Usuário desativado:', profile.id)
      } else {
        console.log('Perfil não encontrado para desativação:', email)
      }

      return new Response(
        JSON.stringify({ success: true, event, action: 'deactivated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // === EVENTOS IGNORADOS ===
    if (event === 'PURCHASE_DELAYED' || event === 'PURCHASE_PROTEST') {
      console.log('Evento ignorado:', event)
      return new Response(
        JSON.stringify({ success: true, event, action: 'ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // === SWITCH_PLAN ===
    if (event === 'SWITCH_PLAN') {
      const plans = (data.plans || []) as Array<Record<string, unknown>>
      const currentPlan = plans.find(p => p.current === true) || plans[0] || {}
      const switchPlanNameParts = [currentPlan.name, plan.name, product.name].filter(Boolean).map(String)
      const switchPlanName = switchPlanNameParts.join(' | ')
      console.log('SWITCH_PLAN planName sources:', switchPlanNameParts)
      const switchProduct = (data.subscription as Record<string, unknown>)?.product as Record<string, unknown> || product
      const switchOffer = (purchase.offer || {}) as Record<string, unknown>
      const switchOfferCode = (switchOffer.code as string | undefined)?.toString().trim() || null
      const resolvedSwitch = await resolverPlano(supabaseAdmin, switchProduct?.id?.toString() || '', switchOfferCode, switchPlanName)
      if (!resolvedSwitch) {
        console.log('SWITCH_PLAN ignorado — plano não reconhecido:', switchPlanName)
        return new Response(
          JSON.stringify({ success: true, event, action: 'ignored_unknown_plan' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      const { planoId, planoTipo } = resolvedSwitch
      const planoInicio = new Date().toISOString().split('T')[0]
      const planoFim = calcularPlanoFim(planoInicio, planoTipo)
      console.log('SWITCH_PLAN - Plano atual:', switchPlanName, '| Resolvido:', planoId, planoTipo)

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        // Get current plan for history
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('plano_id, plano_tipo')
          .eq('id', profile.id)
          .single()

        await supabaseAdmin
          .from('profiles')
          .update({
            plano_id: planoId,
            plano_tipo: planoTipo,
            plano_inicio: planoInicio,
            plano_fim: planoFim,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)

        // Record plan switch history
        await supabaseAdmin.from('historico_planos').insert({
          user_id: profile.id,
          plano_anterior: currentProfile?.plano_id,
          plano_novo: planoId,
          plano_tipo_anterior: currentProfile?.plano_tipo,
          plano_tipo_novo: planoTipo,
          plano_inicio: planoInicio,
          plano_fim: planoFim,
          tipo_evento: 'alteracao',
          origem: 'webhook',
          observacao: `SWITCH_PLAN: ${switchPlanName}`,
        })

        console.log('Plano atualizado:', profile.id, planoId, planoTipo)
      }

      return new Response(
        JSON.stringify({ success: true, event, action: 'plan_switched' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Evento desconhecido
    console.log('Evento não mapeado:', event)
    return new Response(
      JSON.stringify({ success: true, event, action: 'unhandled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('=== Hotmart Webhook - Erro ===', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function enviarEmailBoasVindas(
  email: string,
  nome: string | null,
  planoId: string,
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY não configurada - email de boas-vindas não enviado')
    return
  }

  const nomeDisplay = escapeHtml(nome || 'Confeiteira')
  const emailSafe = escapeHtml(email)
  const planoNome = planoId === 'negocio' ? 'Caixa Business' : 'Caixa Lite'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <p>Olá, ${nomeDisplay}!</p>
      <p>Sua conta foi criada. Veja como acessar a plataforma agora:</p>
      <ol>
        <li>Acesse <a href="https://caixa.umbrelladoce.com.br" style="color: #D89B8C;">caixa.umbrelladoce.com.br</a></li>
        <li>Clique em <strong>"Esqueci minha senha"</strong></li>
        <li>Digite o email <strong>${emailSafe}</strong> para receber o link de acesso</li>
      </ol>
      <p><strong>Seu plano:</strong> ${planoNome}</p>
      <p>Qualquer dúvida, responda este email ou acesse o suporte através do e-mail <a href="mailto:ola@umbrelladoce.com.br" style="color: #D89B8C;">ola@umbrelladoce.com.br</a></p>
      <br/>
      <p>Umbrella Doce</p>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Caixa de Açúcar <noreply@umbrelladoce.com.br>',
        to: [email],
        subject: 'Seu acesso ao Caixa de Açúcar está pronto',
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Erro Resend (webhook):', res.status, errBody)
    } else {
      console.log('Email de boas-vindas enviado para:', email)
    }
  } catch (err) {
    console.error('Erro ao enviar email de boas-vindas:', err)
  }
}


// ============================================================
// E-mails de mudança de plano (upgrade / downgrade / renovação)
// ============================================================

const PLANO_NOME: Record<string, string> = {
  base: 'Caixa Lite',
  negocio: 'Caixa Business',
}

const MODULOS_BUSINESS = [
  'Financeiro completo (Contas a Pagar/Receber, DRE, Fluxo de Caixa)',
  'Controle de Estoque',
  'Planejamento Estratégico',
  'Conversa Doce (IA)',
]

interface MudancaPayload {
  planoAnterior?: string | null
  planoNovo: string
  planoFimNovo?: string
  planoFimAnterior?: string | null
  pendenteInicio?: string
  pendenteFim?: string
  origemHotmart?: string
}

type TipoMudanca = 'upgrade' | 'downgrade_agendado' | 'renovacao'

async function enviarEmailMudancaPlanoAluna(
  email: string,
  nome: string | null,
  tipo: TipoMudanca,
  p: MudancaPayload,
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY não configurada - email mudança aluna não enviado')
    return
  }

  const nomeDisplay = escapeHtml(nome?.trim() || 'Confeiteira')
  const planoNovoNome = PLANO_NOME[p.planoNovo] ?? p.planoNovo
  let subject = ''
  let corpo = ''

  if (tipo === 'upgrade') {
    const validade = escapeHtml(formatarDataBR(p.planoFimNovo!))
    subject = `🚀 Bem-vinda ao ${planoNovoNome} — acesso liberado!`
    corpo = `
      <p>Olá, ${nomeDisplay}!</p>
      <p>Você acaba de desbloquear o <strong>${planoNovoNome}</strong>. Todos os módulos premium já estão disponíveis:</p>
      <ul style="padding-left: 18px;">
        ${MODULOS_BUSINESS.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
      </ul>
      <p>Seu acesso vai até <strong>${validade}</strong> e todos os seus dados continuam intactos.</p>
    `
  } else if (tipo === 'renovacao') {
    const validade = escapeHtml(formatarDataBR(p.planoFimNovo!))
    subject = `✨ Renovação confirmada — ${planoNovoNome} até ${validade}`
    corpo = `
      <p>Olá, ${nomeDisplay}!</p>
      <p>Sua renovação anual do <strong>${planoNovoNome}</strong> foi confirmada. Acesso garantido até <strong>${validade}</strong>, sem interrupção e com tudo no lugar.</p>
      <p>Obrigada por continuar com a gente. 💛</p>
    `
  } else {
    // downgrade_agendado
    const fimAtual = escapeHtml(formatarDataBR(p.planoFimAnterior!))
    const inicioLite = escapeHtml(formatarDataBR(p.pendenteInicio!))
    subject = `Mudança de plano confirmada — ${planoNovoNome} a partir de ${inicioLite}`
    corpo = `
      <p>Olá, ${nomeDisplay}!</p>
      <p>Recebemos sua contratação do <strong>${planoNovoNome}</strong>. Como você ainda tem acesso ao Caixa Business até <strong>${fimAtual}</strong>, sua mudança acontece automaticamente nessa data — você não perde nem um dia do que já pagou.</p>
      <p style="background:#FDF6EE;border-left:4px solid #C9A14A;padding:12px 16px;margin:20px 0;border-radius:6px;">
        <strong>A partir de ${inicioLite}:</strong><br/>
        ✅ Continua: Encomendas, Receitas, Precificação, Clientes &amp; Fornecedores, Cadastros, Meu Painel<br/>
        ⏸️ Fica em pausa: Financeiro completo, Controle de Estoque, Planejamento Estratégico, Conversa Doce
      </p>
      <p>Seus dados ficam preservados — se um dia voltar para o Business, está tudo aqui.</p>
    `
  }

  const html = `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;color:#121212;line-height:1.6;background:#FDF6EE;padding:32px 24px;border-radius:12px;">
      <h1 style="color:#5B1A2B;font-size:22px;margin:0 0 16px;">${subject.replace(/[—-].*$/, '').trim()}</h1>
      ${corpo}
      <div style="text-align:center;margin:32px 0;">
        <a href="https://caixa.umbrelladoce.com.br" style="background:#5B1A2B;color:#FFF9F5;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Acessar minha conta</a>
      </div>
      <p style="font-size:13px;color:#555;">Dúvidas? Fale com a gente em <a href="mailto:ola@umbrelladoce.com.br" style="color:#5B1A2B;">ola@umbrelladoce.com.br</a>.</p>
      <p style="margin-top:24px;">Com carinho,<br/><strong>Equipe Umbrella Doce</strong></p>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Caixa de Açúcar <noreply@umbrelladoce.com.br>',
        to: [email],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error(`Erro Resend (${tipo} aluna):`, res.status, await res.text())
    } else {
      console.log(`Email ${tipo} enviado para aluna:`, email)
    }
  } catch (err) {
    console.error(`Erro ao enviar email ${tipo} aluna:`, err)
  }
}

async function enviarEmailMudancaPlanoAdmin(
  emailAluna: string,
  nomeAluna: string | null,
  tipo: TipoMudanca,
  p: MudancaPayload,
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailAdmin = Deno.env.get('EMAIL_ADMIN_IMERSAO')
  if (!resendApiKey || !emailAdmin) {
    console.warn('EMAIL_ADMIN_IMERSAO ou RESEND_API_KEY ausente - email admin não enviado')
    return
  }

  const nomeDisplay = escapeHtml(nomeAluna?.trim() || 'Aluna')
  const emailSafe = escapeHtml(emailAluna)
  const planoAntNome = p.planoAnterior ? (PLANO_NOME[p.planoAnterior] ?? p.planoAnterior) : '—'
  const planoNovoNome = PLANO_NOME[p.planoNovo] ?? p.planoNovo
  const origemSafe = escapeHtml(p.origemHotmart || '')

  let subject = ''
  let linhas = ''

  if (tipo === 'upgrade') {
    subject = `Upgrade: ${nomeAluna?.trim() || emailAluna} → ${planoNovoNome}`
    linhas = `
      <tr><td><strong>De:</strong></td><td>${escapeHtml(planoAntNome)}</td></tr>
      <tr><td><strong>Para:</strong></td><td>${planoNovoNome} (anual)</td></tr>
      <tr><td><strong>Nova validade:</strong></td><td>${escapeHtml(formatarDataBR(p.planoFimNovo!))}</td></tr>
    `
  } else if (tipo === 'renovacao') {
    subject = `Renovação: ${nomeAluna?.trim() || emailAluna} → ${planoNovoNome}`
    linhas = `
      <tr><td><strong>Plano:</strong></td><td>${planoNovoNome} (anual) — renovação</td></tr>
      <tr><td><strong>Nova validade:</strong></td><td>${escapeHtml(formatarDataBR(p.planoFimNovo!))}</td></tr>
    `
  } else {
    subject = `Downgrade agendado: ${nomeAluna?.trim() || emailAluna} → ${planoNovoNome} em ${formatarDataBR(p.pendenteInicio!)}`
    linhas = `
      <tr><td><strong>De:</strong></td><td>${escapeHtml(planoAntNome)}</td></tr>
      <tr><td><strong>Para:</strong></td><td>${planoNovoNome} (anual)</td></tr>
      <tr><td><strong>Vigência atual mantida até:</strong></td><td>${escapeHtml(formatarDataBR(p.planoFimAnterior!))}</td></tr>
      <tr><td><strong>${planoNovoNome} ativa em:</strong></td><td>${escapeHtml(formatarDataBR(p.pendenteInicio!))}</td></tr>
      <tr><td><strong>Nova validade ${planoNovoNome}:</strong></td><td>${escapeHtml(formatarDataBR(p.pendenteFim!))}</td></tr>
    `
  }

  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#121212;line-height:1.6;">
      <h2 style="color:#5B1A2B;">${escapeHtml(subject)}</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 0;"><strong>Aluna:</strong></td><td>${nomeDisplay}</td></tr>
        <tr><td style="padding:6px 0;"><strong>E-mail:</strong></td><td>${emailSafe}</td></tr>
        ${linhas}
        ${origemSafe ? `<tr><td style="padding:6px 0;"><strong>Origem Hotmart:</strong></td><td>${origemSafe}</td></tr>` : ''}
      </table>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Caixa de Açúcar <noreply@umbrelladoce.com.br>',
        to: [emailAdmin],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error(`Erro Resend (${tipo} admin):`, res.status, await res.text())
    } else {
      console.log(`Email ${tipo} enviado para admin:`, emailAdmin)
    }
  } catch (err) {
    console.error(`Erro ao enviar email ${tipo} admin:`, err)
  }
}