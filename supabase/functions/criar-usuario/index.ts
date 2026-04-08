import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: criar-usuario
 * Criação de usuários por admins autenticados via JWT.
 * Envia convite por email (Magic Link) — sem senha temporária.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Criar Usuário - Início ===')

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente não configuradas')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // === VERIFICAÇÃO DE AUTENTICAÇÃO (apenas JWT de admin) ===
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação ausente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: { user: callerUser }, error: callerError } = await userClient.auth.getUser()
    if (callerError || !callerUser) {
      console.error('Erro ao identificar usuário chamador:', callerError)
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Usuário chamador:', callerUser.id)

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .single()

    if (!adminRole) {
      console.error('Usuário não é admin:', callerUser.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado. Apenas administradores podem criar usuários.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }
    // === FIM VERIFICAÇÃO DE AUTENTICAÇÃO ===

    const requestBody = await req.json()
    const { email, nomeCompleto, nomeConfeitaria, planoId, role } = requestBody

    // Resolução de datas do plano
    const planoTipo = requestBody.planoTipo || null
    const hoje = new Date().toISOString().split('T')[0]
    let planoInicio: string | null = requestBody.planoInicio || hoje
    let planoFim: string | null = null

    if (requestBody.planoExpiraEm) {
      planoFim = requestBody.planoExpiraEm.split('T')[0]
    } else if (requestBody.planoFim) {
      planoFim = requestBody.planoFim
    } else if (planoTipo) {
      // Calcular automaticamente
      const fim = new Date()
      fim.setDate(fim.getDate() + (planoTipo === 'anual' ? 365 : 30))
      planoFim = fim.toISOString().split('T')[0]
    }

    console.log('Dados:', { email, nomeCompleto, nomeConfeitaria, planoId, planoTipo, planoInicio, planoFim })

    // Verificar se o usuário existe no Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users?.find(u => u.email === email)

    // Verificar perfil
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, ativo')
      .eq('email', email)
      .single()

    const planoFields = {
      plano_id: planoId || null,
      plano_tipo: planoTipo,
      plano_inicio: planoInicio,
      plano_fim: planoFim,
    }

    let userId: string

    if (existingAuthUser && existingProfile) {
      if (existingProfile.ativo === true) {
        userId = existingAuthUser.id
        await supabaseAdmin
          .from('profiles')
          .update({ ...planoFields, updated_at: new Date().toISOString() })
          .eq('id', userId)

        return new Response(
          JSON.stringify({ success: true, user: { id: userId }, reactivated: false, updated: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Reativar
      userId = existingAuthUser.id
      await supabaseAdmin
        .from('profiles')
        .update({
          ativo: true,
          nome_completo: nomeCompleto,
          nome_confeitaria: nomeConfeitaria,
          primeiro_acesso: true,
          ...planoFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl}/dashboard`
      })

      console.log('Usuário reativado:', userId)
    } else if (existingAuthUser && !existingProfile) {
      userId = existingAuthUser.id
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          nome_completo: nomeCompleto,
          nome_confeitaria: nomeConfeitaria,
          ativo: true,
          primeiro_acesso: true,
          ...planoFields,
        })
      console.log('Perfil criado para usuário existente:', userId)
    } else {
      // Novo usuário via Magic Link
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { nome_completo: nomeCompleto, nome_confeitaria: nomeConfeitaria },
        redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl}/dashboard`
      })

      if (inviteError || !inviteData.user) {
        throw inviteError || new Error('Erro ao criar usuário')
      }

      userId = inviteData.user.id
      console.log('Novo usuário convidado:', userId)

      await new Promise(resolve => setTimeout(resolve, 2000))

      await supabaseAdmin
        .from('profiles')
        .update({ primeiro_acesso: true, ...planoFields })
        .eq('id', userId)
    }

    // Gerenciar roles
    if (role && role !== 'user') {
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single()

      if (!existingRole) {
        await supabaseAdmin
          .from('user_roles')
          .insert([{ user_id: userId, role }])
      }
    }

    // Log admin
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: callerUser.id,
      admin_email: callerUser.email || '',
      acao: 'criou_usuario',
      usuario_afetado_id: userId,
      usuario_afetado_email: email,
      detalhes: { planoId, planoTipo, nomeCompleto, nomeConfeitaria }
    })

    console.log('=== Criar Usuário - Sucesso ===')
    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId },
        reactivated: existingProfile?.ativo === false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('=== Criar Usuário - Erro ===', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
