import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'
import { escapeHtml } from '../_shared/escapeHtml.ts'

// Rate limit por IP (em memória).
// IMPORTANTE: o contador NÃO é persistente — reseta a cada restart da Edge Function.
// Esta é apenas uma proteção contra burst simples vindo do mesmo IP,
// NÃO protege contra ataques distribuídos (múltiplos IPs coordenados).
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // === RATE LIMITING POR IP ===
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0].trim()) || 'unknown'
  const now = Date.now()

  // Limpa entradas expiradas
  for (const [key, value] of rateMap) {
    if (now >= value.resetAt) rateMap.delete(key)
  }

  const entry = rateMap.get(ip)
  if (!entry || now >= entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  } else if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return new Response(
      JSON.stringify({ error: 'rate_limit_exceeded', retry_after: retryAfter }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) }, status: 429 }
    )
  } else {
    entry.count += 1
    rateMap.set(ip, entry)
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

    // === VERIFICAÇÃO DE AUTENTICAÇÃO ===
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
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .single()

    if (!adminRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado. Apenas administradores podem criar usuários.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const requestBody = await req.json()
    const { email, nomeCompleto, nomeConfeitaria, planoId, role, imersaoTurma } = requestBody

    const planoTipo = requestBody.planoTipo || null
    const hoje = new Date().toISOString().split('T')[0]
    let planoInicio: string | null = requestBody.planoInicio || hoje
    let planoFim: string | null = null

    const diasMap: Record<string, number> = { anual: 365, mensal: 30, imersao: 30 }

    if (requestBody.planoFim) {
      planoFim = requestBody.planoFim
    } else if (requestBody.planoExpiraEm) {
      planoFim = requestBody.planoExpiraEm.split('T')[0]
    } else if (planoTipo) {
      const fim = new Date(planoInicio!)
      fim.setDate(fim.getDate() + (diasMap[planoTipo] ?? 365))
      planoFim = fim.toISOString().split('T')[0]
    }

    const isImersao = planoId === 'aluna_imersao'

    console.log('Dados:', { email, nomeCompleto, nomeConfeitaria, planoId, planoTipo, planoInicio, planoFim, imersaoTurma })

    // Verificar se o usuário existe no Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users?.find(u => u.email === email)

    // Verificar perfil
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, ativo')
      .eq('email', email)
      .single()

    const planoFields: Record<string, any> = {
      plano_id: planoId || null,
      plano_tipo: planoTipo,
      plano_inicio: planoInicio,
      plano_fim: planoFim,
      origem_criacao: isImersao ? 'imersao' : 'admin',
    }

    if (isImersao) {
      planoFields.imersao_turma = imersaoTurma || null
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

      // Enviar email de boas-vindas via Resend
      await enviarEmailBoasVindas(email, nomeCompleto, planoId, planoTipo)

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

      await enviarEmailBoasVindas(email, nomeCompleto, planoId, planoTipo)
      console.log('Perfil criado para usuário existente:', userId)
    } else {
      // Novo usuário - criar com senha temporária (usuário define no primeiro acesso)
      const senhaTemporaria = crypto.randomUUID()
      
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senhaTemporaria,
        email_confirm: true,
        user_metadata: { nome_completo: nomeCompleto, nome_confeitaria: nomeConfeitaria }
      })

      if (createError || !createData.user) {
        throw createError || new Error('Erro ao criar usuário')
      }

      userId = createData.user.id
      console.log('Novo usuário criado:', userId)

      await new Promise(resolve => setTimeout(resolve, 2000))

      await supabaseAdmin
        .from('profiles')
        .update({ primeiro_acesso: true, ...planoFields })
        .eq('id', userId)

      // Gerar magic link para o email de boas-vindas
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${Deno.env.get('SITE_URL') || supabaseUrl}/dashboard`
        }
      })

      const magicLink = linkData?.properties?.action_link || null

      await enviarEmailBoasVindas(email, nomeCompleto, planoId, planoTipo, magicLink)
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
      detalhes: { planoId, planoTipo, planoInicio, planoFim, nomeCompleto, nomeConfeitaria }
    })

    // Record plan history
    await supabaseAdmin.from('historico_planos').insert({
      user_id: userId,
      plano_novo: planoId || 'base',
      plano_tipo_novo: planoTipo || 'mensal',
      plano_inicio: planoInicio,
      plano_fim: planoFim,
      tipo_evento: 'criacao',
      origem: 'admin',
      admin_id: callerUser.id,
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

async function enviarEmailBoasVindas(
  email: string,
  nome: string | null,
  planoId: string,
  _planoTipo: string | null,
  _magicLink?: string | null
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
      console.error('Erro Resend:', res.status, errBody)
    } else {
      console.log('Email de boas-vindas enviado para:', email)
    }
  } catch (err) {
    console.error('Erro ao enviar email de boas-vindas:', err)
  }
}
