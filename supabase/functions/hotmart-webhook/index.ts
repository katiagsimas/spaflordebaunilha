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
  const isAnual = nome.includes('anual') || nome.includes('annual') || nome.includes('yearly')
  const planoTipo = isAnual ? 'anual' : 'mensal'

  const isNegocio = nome.includes('negocio') || nome.includes('negócio') || nome.includes('business')
  const planoId = isNegocio ? 'negocio' : 'base'

  return { planoId, planoTipo }
}

function calcularPlanoFim(planoTipo: string): string {
  const agora = new Date()
  const dias = planoTipo === 'anual' ? 365 : 30
  agora.setDate(agora.getDate() + dias)
  return agora.toISOString().split('T')[0]
}

/**
 * Extrai o hottok do request — Hotmart pode enviar como:
 * 1. Query parameter: ?hottok=xxx
 * 2. Campo no body (payload v1)
 */
function extrairHottok(req: Request, body: Record<string, unknown>): string | null {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get('hottok')
  const fromHeader = req.headers.get('x-hotmart-hottok')
  const fromBody = (body.hottok as string) || null
  console.log('Hottok sources - query:', !!fromQuery, '| header:', !!fromHeader, '| body:', !!fromBody)
  return fromQuery || fromHeader || fromBody || null
}

/**
 * Extrai email do comprador — Hotmart v2.0 usa data.buyer OU data.subscriber
 */
function extrairEmail(data: Record<string, unknown>): string | null {
  const buyer = (data.buyer || {}) as Record<string, unknown>
  const subscriber = (data.subscriber || {}) as Record<string, unknown>
  // SWITCH_PLAN usa data.subscription.user.email
  const subscription = (data.subscription || {}) as Record<string, unknown>
  const subscriptionUser = (subscription.user || {}) as Record<string, unknown>
  const email = (buyer.email || subscriber.email || subscriptionUser.email) as string | undefined
  return email?.toLowerCase()?.trim() || null
}

/**
 * Extrai nome do comprador
 */
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

    // Validar hottok (query param ou body)
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
      const planName = (plan.name || (purchase.offer as Record<string, unknown>)?.key || product.name || '') as string
      const { planoId, planoTipo } = resolverPlano(product.id?.toString() || '', planName)
      const planoInicio = new Date().toISOString().split('T')[0]
      const planoFim = calcularPlanoFim(planoTipo)

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
      }

      let userId: string

      if (existingUser && existingProfile) {
        userId = existingUser.id
        await supabaseAdmin
          .from('profiles')
          .update({
            ativo: true,
            nome_completo: buyerName || existingProfile.id,
            primeiro_acesso: existingProfile.ativo === false,
            ...planoFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (existingProfile.ativo === false) {
          await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl}/dashboard`
          })
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
        console.log('Perfil criado para usuário existente:', userId)
      } else {
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { nome_completo: buyerName || null },
          redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl}/dashboard`
        })

        if (inviteError || !inviteData.user) {
          console.error('Erro ao convidar:', inviteError)
          throw new Error(inviteError?.message || 'Erro ao criar usuário')
        }

        userId = inviteData.user.id
        console.log('Novo usuário convidado:', userId)

        await new Promise(resolve => setTimeout(resolve, 2000))

        await supabaseAdmin
          .from('profiles')
          .update({ primeiro_acesso: true, ...planoFields })
          .eq('id', userId)
      }

      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'user' }, { onConflict: 'user_id,role' })

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
        await supabaseAdmin
          .from('profiles')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', profile.id)

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
      // SWITCH_PLAN: plano atual está em data.plans[] com current=true
      const plans = (data.plans || []) as Array<Record<string, unknown>>
      const currentPlan = plans.find(p => p.current === true) || plans[0] || {}
      const switchPlanName = (currentPlan.name || plan.name || '') as string
      const switchProduct = (data.subscription as Record<string, unknown>)?.product as Record<string, unknown> || product
      const { planoId, planoTipo } = resolverPlano(switchProduct?.id?.toString() || '', switchPlanName)
      const planoFim = calcularPlanoFim(planoTipo)
      console.log('SWITCH_PLAN - Plano atual:', switchPlanName, '| Resolvido:', planoId, planoTipo)

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            plano_id: planoId,
            plano_tipo: planoTipo,
            plano_fim: planoFim,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)

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
