import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Hotmart Webhook — Provisiona e gerencia usuários automaticamente.
 * Eventos tratados:
 *   - PURCHASE_APPROVED / PURCHASE_COMPLETE → cria/ativa usuário
 *   - PURCHASE_CANCELED / PURCHASE_REFUNDED / PURCHASE_CHARGEBACK → desativa usuário
 *   - SUBSCRIPTION_CANCELLATION → desativa usuário
 *   - PURCHASE_DELAYED / PURCHASE_PROTEST → ignora (não altera estado)
 *   - SWITCH_PLAN → atualiza plano
 */

function resolverPlano(productId: string, planName: string | null): { planoId: string; planoTipo: string } {
  // Detectar periodicidade pelo nome do plano ou offer
  const nome = (planName || '').toLowerCase()
  const isAnual = nome.includes('anual') || nome.includes('annual') || nome.includes('yearly')
  const planoTipo = isAnual ? 'anual' : 'mensal'

  // Detectar plano pelo nome
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Hotmart Webhook - Início ===')

  try {
    // Validar hottok
    const hottok = Deno.env.get('HOTMART_HOTTOK')
    if (!hottok) {
      console.error('HOTMART_HOTTOK não configurado')
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const body = await req.json()

    // Validar hottok do payload
    if (body.hottok !== hottok) {
      console.error('Hottok inválido')
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const event = body.event
    const data = body.data || {}
    const buyer = data.buyer || {}
    const purchase = data.purchase || {}
    const subscription = data.subscription || {}
    const product = data.product || {}

    const email = buyer.email?.toLowerCase()?.trim()
    if (!email) {
      console.error('Email do comprador ausente')
      return new Response(
        JSON.stringify({ error: 'Email do comprador ausente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Evento:', event, '| Email:', email, '| Produto:', product.name)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // === EVENTOS DE ATIVAÇÃO ===
    if (['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'].includes(event)) {
      const planName = subscription.plan?.name || purchase.offer?.key || product.name || ''
      const { planoId, planoTipo } = resolverPlano(product.id?.toString() || '', planName)
      const planoInicio = new Date().toISOString().split('T')[0]
      const planoFim = calcularPlanoFim(planoTipo)

      console.log('Provisionando usuário:', { planoId, planoTipo, planoInicio, planoFim })

      // Verificar se usuário existe no Auth
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = authUsers.users?.find(u => u.email === email)

      // Verificar perfil
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
        // Atualizar/reativar
        await supabaseAdmin
          .from('profiles')
          .update({
            ativo: true,
            nome_completo: buyer.name || existingProfile.id,
            primeiro_acesso: existingProfile.ativo === false,
            ...planoFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        // Se estava inativo, enviar novo Magic Link
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
            nome_completo: buyer.name || null,
            ativo: true,
            primeiro_acesso: true,
            ...planoFields,
          })
        console.log('Perfil criado para usuário existente:', userId)
      } else {
        // Novo usuário — convite por email
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { nome_completo: buyer.name || null },
          redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl}/dashboard`
        })

        if (inviteError || !inviteData.user) {
          console.error('Erro ao convidar:', inviteError)
          throw new Error(inviteError?.message || 'Erro ao criar usuário')
        }

        userId = inviteData.user.id
        console.log('Novo usuário convidado:', userId)

        // Aguardar trigger criar perfil
        await new Promise(resolve => setTimeout(resolve, 2000))

        await supabaseAdmin
          .from('profiles')
          .update({ primeiro_acesso: true, ...planoFields })
          .eq('id', userId)
      }

      // Garantir role 'user'
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

    // === RENOVAÇÃO ===
    if (event === 'PURCHASE_DELAYED' || event === 'PURCHASE_PROTEST') {
      // Ignorar — não alterar estado do usuário
      console.log('Evento ignorado:', event)
      return new Response(
        JSON.stringify({ success: true, event, action: 'ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // === SWITCH_PLAN (troca de plano) ===
    if (event === 'SWITCH_PLAN') {
      const planName = subscription.plan?.name || ''
      const { planoId, planoTipo } = resolverPlano(product.id?.toString() || '', planName)
      const planoFim = calcularPlanoFim(planoTipo)

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

    // Evento desconhecido — aceitar sem processar
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
