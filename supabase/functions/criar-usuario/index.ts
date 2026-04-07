import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

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
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // === VERIFICAÇÃO DE AUTENTICAÇÃO ===
    const apiSecret = req.headers.get('x-api-secret')
    const externalApiSecret = Deno.env.get('EXTERNAL_API_SECRET')
    
    let isExternalApi = false
    
    if (apiSecret && externalApiSecret && apiSecret === externalApiSecret) {
      console.log('Autenticação via x-api-secret (API externa)')
      isExternalApi = true
    } else {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Token de autenticação ausente')
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
    }
    // === FIM VERIFICAÇÃO DE AUTENTICAÇÃO ===

    const requestBody = await req.json()
    console.log('Dados recebidos:', {
      email: requestBody.email,
      nomeCompleto: requestBody.nomeCompleto,
      nomeConfeitaria: requestBody.nomeConfeitaria,
      planoId: requestBody.planoId,
      planoTipo: requestBody.planoTipo,
      planoExpiraEm: requestBody.planoExpiraEm,
      planoInicio: requestBody.planoInicio,
      planoFim: requestBody.planoFim,
      role: requestBody.role,
    })

    const { email, nomeCompleto, nomeConfeitaria, planoId, role } = requestBody

    // === RESOLUÇÃO DE DATAS DO PLANO ===
    // Prioridade: planoExpiraEm (da Hotmart/Umbrella) > planoFim (legado)
    const planoTipo = requestBody.planoTipo || null // "mensal" | "anual" | null
    const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    let planoInicio: string | null = requestBody.planoInicio || hoje
    let planoFim: string | null = null

    if (requestBody.planoExpiraEm) {
      // planoExpiraEm vem como ISO timestamp — extrair apenas a data
      planoFim = requestBody.planoExpiraEm.split('T')[0]
      console.log('planoFim resolvido via planoExpiraEm:', planoFim)
    } else if (requestBody.planoFim) {
      planoFim = requestBody.planoFim
      console.log('planoFim resolvido via campo legado planoFim:', planoFim)
    }

    console.log('Plano resolvido:', { planoId, planoTipo, planoInicio, planoFim })

    // Verificar se o usuário existe no Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users?.find(u => u.email === email)

    console.log('Usuário encontrado no Auth:', existingAuthUser ? 'Sim' : 'Não')

    // Verificar se o email já existe no perfil
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, ativo')
      .eq('email', email)
      .single()

    console.log('Perfil encontrado:', existingProfile)

    // Campos de plano para inserção/atualização
    const planoFields = {
      plano_id: planoId || null,
      plano_tipo: planoTipo,
      plano_inicio: planoInicio,
      plano_fim: planoFim,
    }

    let userId: string

    if (existingAuthUser && existingProfile) {
      console.log('Usuário encontrado no Auth e Perfil')

      if (existingProfile.ativo === true) {
        // Usuário ativo existente — atualizar plano
        userId = existingAuthUser.id

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            ...planoFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Erro ao atualizar plano:', updateError)
          throw updateError
        }
        console.log('Plano atualizado para usuário existente')

        return new Response(
          JSON.stringify({
            success: true,
            user: { id: userId },
            reactivated: false,
            updated: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Usuário existe mas está inativo — reativar
      console.log('Reativando usuário inativo...')
      userId = existingAuthUser.id

      const { error: updateError } = await supabaseAdmin
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

      if (updateError) {
        console.error('Erro ao reativar usuário:', updateError)
        throw updateError
      }

      // Enviar Magic Link para o usuário reativado
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl.replace('.supabase.co', '')}/dashboard`
      })

      if (inviteError) {
        console.warn('Aviso: não foi possível enviar convite por e-mail:', inviteError.message)
      }

      console.log('Usuário reativado com sucesso')
    } else if (existingAuthUser && !existingProfile) {
      // Usuário existe no Auth mas não tem perfil — criar perfil
      console.log('Usuário existe no Auth mas sem perfil, criando perfil...')
      userId = existingAuthUser.id

      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          nome_completo: nomeCompleto,
          nome_confeitaria: nomeConfeitaria,
          ativo: true,
          primeiro_acesso: true,
          ...planoFields,
        })

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError)
        throw insertError
      }

      console.log('Perfil criado com sucesso para usuário existente no Auth')
    } else {
      // Usuário não existe — criar via Magic Link (inviteUserByEmail)
      console.log('Criando novo usuário via Magic Link...')

      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          nome_completo: nomeCompleto,
          nome_confeitaria: nomeConfeitaria,
        },
        redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl.replace('.supabase.co', '')}/dashboard`
      })

      if (inviteError) {
        console.error('Erro ao convidar usuário:', inviteError)
        throw inviteError
      }

      if (!inviteData.user) {
        throw new Error('Erro ao criar usuário')
      }

      userId = inviteData.user.id
      console.log('Usuário convidado com sucesso:', userId)

      // Aguardar o trigger criar o perfil, depois atualizar com dados do plano
      await new Promise(resolve => setTimeout(resolve, 2000))

      const { error: planError } = await supabaseAdmin
        .from('profiles')
        .update({
          primeiro_acesso: true,
          ...planoFields,
        })
        .eq('id', userId)

      if (planError) {
        console.warn('Aviso: não foi possível atualizar plano:', planError.message)
      } else {
        console.log('Plano atualizado com sucesso para novo usuário')
      }
    }

    // Gerenciar roles do usuário
    if (role && role !== 'user') {
      console.log('Verificando role e adicionando se necessário:', role)

      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single()

      if (!existingRole) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert([{ user_id: userId, role: role }])

        if (roleError) {
          console.error('Erro ao adicionar role:', roleError)
          throw roleError
        }
        console.log('Role adicionada com sucesso')
      }
    }

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
    console.error('=== Criar Usuário - Erro ===')
    console.error('Erro completo:', error)

    let errorMessage = 'Erro desconhecido ao criar usuário'
    let statusCode = 400

    if (error instanceof Error) {
      errorMessage = error.message
      if ('status' in error) {
        statusCode = (error as any).status
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
    )
  }
})