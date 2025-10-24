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

    console.log('Criando usuário no Auth...')
    
    // Criar usuário via Supabase Auth Admin
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

    console.log('Usuário criado com sucesso:', authData.user.id)

    // Adicionar role do usuário se não for 'user' (que é criado automaticamente)
    if (role !== 'user') {
      console.log('Adicionando role:', role)
      
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          role: role,
        }])

      if (roleError) {
        console.error('Erro ao adicionar role:', roleError)
        throw roleError
      }
      
      console.log('Role adicionada com sucesso')
    }

    console.log('=== Criar Usuário - Sucesso ===')
    
    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
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
