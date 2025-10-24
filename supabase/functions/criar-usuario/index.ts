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

    console.log('URL configurada:', supabaseUrl ? 'Sim' : 'Não')
    console.log('Service Key configurada:', supabaseServiceKey ? 'Sim' : 'Não')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente não configuradas')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Cliente Supabase Admin criado')

    const requestBody = await req.json()
    console.log('Dados recebidos:', {
      email: requestBody.email,
      nomeCompleto: requestBody.nomeCompleto,
      nomeConfeitaria: requestBody.nomeConfeitaria,
      role: requestBody.role
    })

    const { email, senha, nomeCompleto, nomeConfeitaria, role } = requestBody

    console.log('Verificando se usuário já existe...')
    
    // Primeiro: verificar se o usuário existe no Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users?.find(u => u.email === email)
    
    console.log('Usuário encontrado no Auth:', existingAuthUser ? 'Sim' : 'Não')
    
    // Verificar se o email já existe no perfil (ativo ou inativo)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, ativo')
      .eq('email', email)
      .single()
    
    console.log('Perfil encontrado:', existingProfile)

    let userId: string
    
    if (existingAuthUser && existingProfile) {
      console.log('Usuário encontrado no Auth e Perfil')
      
      if (existingProfile.ativo === true) {
        throw new Error('Este email já está em uso por um usuário ativo')
      }
      
      // Usuário existe mas está inativo - reativar
      console.log('Reativando usuário inativo...')
      userId = existingAuthUser.id
      
      // Atualizar perfil para reativar
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ativo: true,
          nome_completo: nomeCompleto,
          nome_confeitaria: nomeConfeitaria,
          primeiro_acesso: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (updateError) {
        console.error('Erro ao reativar usuário:', updateError)
        throw updateError
      }
      
      // Atualizar senha do usuário no Auth
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: senha }
      )
      
      if (passwordError) {
        console.error('Erro ao atualizar senha:', passwordError)
        throw passwordError
      }
      
      console.log('Usuário reativado com sucesso')
    } else if (existingAuthUser && !existingProfile) {
      // Usuário existe no Auth mas não tem perfil - criar perfil
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
          primeiro_acesso: true
        })
      
      if (insertError) {
        console.error('Erro ao criar perfil:', insertError)
        throw insertError
      }
      
      // Atualizar senha
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: senha }
      )
      
      if (passwordError) {
        console.error('Erro ao atualizar senha:', passwordError)
        throw passwordError
      }
      
      console.log('Perfil criado com sucesso para usuário existente no Auth')
    } else {
      // Usuário não existe - criar novo
      console.log('Criando novo usuário no Auth...')
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome_completo: nomeCompleto,
          nome_confeitaria: nomeConfeitaria,
        },
      })

      if (authError) {
        console.error('Erro ao criar usuário no Auth:', authError)
        throw authError
      }
      
      if (!authData.user) {
        console.error('Usuário não foi criado')
        throw new Error('Erro ao criar usuário')
      }

      userId = authData.user.id
      console.log('Usuário criado com sucesso:', userId)
    }

    // Gerenciar roles do usuário
    if (role !== 'user') {
      console.log('Verificando role atual e adicionando se necessário:', role)
      
      // Verificar se a role já existe
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single()
      
      if (!existingRole) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: role,
          }])

        if (roleError) {
          console.error('Erro ao adicionar role:', roleError)
          throw roleError
        }
        
        console.log('Role adicionada com sucesso')
      } else {
        console.log('Role já existe para este usuário')
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
      
      // Extrair código de status se for um AuthApiError
      if ('status' in error) {
        statusCode = (error as any).status
      }
    }
    
    console.error('Mensagem de erro:', errorMessage)
    console.error('Status code:', statusCode)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: statusCode 
      }
    )
  }
})
