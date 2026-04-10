import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Hotmart Webhook v2.0 — Provisiona e gerencia usuários automaticamente.
 * Eventos tratados:
 *   - PURCHASE_APPROVED / PURCHASE_COMPLETE → cria/ativa usuário
 *   - PURCHASE_CANCELED / PURCHASE_REFUNDED / PURCHASE_CHARGEBACK → desativa usuário
 *   - SUBSCRIPTION_CANCELLATION → desativa usuário
 *   - PURCHASE_DELAYED / PURCHASE_PROTEST → ignora (não altera estado)
 *   - SWITCH_PLAN → atualiza plano
 */

function resolverPlano(productId: string, planName: string | null): { planoId: string; planoTipo: string } {
  const nome = (planName || '').toLowerCase()
  console.log('resolverPlano - input:', { productId, planName, nomeLower: nome })

  const isStart = nome.includes('start') || nome.includes('caixa start')
  const isNegocio = nome.includes('business') || nome.includes('negocio') || nome.includes('negócio') || nome.includes('caixa business')

  if (isStart) {
    const is14 = nome.includes('14')
    console.log('resolverPlano - detectado Start, is14:', is14)
    return { planoId: 'start', planoTipo: is14 ? '14dias' : '7dias' }
  }

  const planoId = isNegocio ? 'negocio' : 'base'

  // Caixa Lite é sempre anual; Business pode ser mensal ou anual
  if (planoId === 'base') {
    return { planoId, planoTipo: 'anual' }
  }

  const isAnual = nome.includes('anual') || nome.includes('annual') || nome.includes('yearly')
  const planoTipo = isAnual ? 'anual' : 'mensal'

  return { planoId, planoTipo }
}

function calcularPlanoFim(planoInicio: string, planoTipo: string): string {
  const inicio = new Date(planoInicio + 'T00:00:00')
  const diasMap: Record<string, number> = { 'anual': 365, 'mensal': 30, '7dias': 7, '14dias': 14 }
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
      const { planoId, planoTipo } = resolverPlano(product.id?.toString() || '', planName)
      const planoInicio = new Date().toISOString().split('T')[0]
      const planoFim = calcularPlanoFim(planoInicio, planoTipo)

      console.log('Provisionando usuário:', { planoId, planoTipo, planoInicio, planoFim })

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = authUsers.users?.find(u => u.email === email)

      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, ativo')
        .eq('email', email)
        .single()

      const planoFields = {
        plano_id: planoId,
        plano_tipo: planoTipo,
        plano_inicio: planoInicio,
        plano_fim: planoFim,
        origem_criacao: 'webhook',
      }

      let userId: string

      if (existingUser && existingProfile) {
        userId = existingUser.id
        await supabaseAdmin
          .from('profiles')
          .update({
            ativo: true,
            nome_completo: buyerName || undefined,
            primeiro_acesso: existingProfile.ativo === false,
            ...planoFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (existingProfile.ativo === false) {
          await enviarEmailBoasVindas(email, buyerName, planoId)
        }

        console.log('Usuário existente atualizado:', userId)
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
      await supabaseAdmin.from('historico_planos').insert({
        user_id: userId,
        plano_novo: planoId,
        plano_tipo_novo: planoTipo,
        plano_inicio: planoInicio,
        plano_fim: planoFim,
        tipo_evento: 'criacao',
        origem: 'webhook',
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
      const { planoId, planoTipo } = resolverPlano(switchProduct?.id?.toString() || '', switchPlanName)
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

  const nomeDisplay = nome || 'Confeiteira'
  const planoNome = planoId === 'negocio' ? 'Caixa Business' : 'Caixa Lite'

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <p>Olá, ${nomeDisplay}!</p>
      <p>Sua conta foi criada. Veja como acessar a plataforma agora:</p>
      <ol>
        <li>Acesse <a href="https://caixa.umbrelladoce.com.br" style="color: #D89B8C;">caixa.umbrelladoce.com.br</a></li>
        <li>Clique em <strong>"Esqueci minha senha"</strong></li>
        <li>Digite o email <strong>${email}</strong> para receber o link de acesso</li>
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