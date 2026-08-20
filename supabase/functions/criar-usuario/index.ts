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

    // === NOVO: tipo de usuário (mestre/membro) ===
    // tipoUsuario = 'mestre'  -> cria grupo novo (ou usa criarGrupo=true), passa pelo onboarding
    // tipoUsuario = 'membro'  -> vincula a grupo existente, sem onboarding, herda plano do mestre
    const tipoUsuario: 'mestre' | 'membro' = requestBody.tipoUsuario === 'membro' ? 'membro' : 'mestre'
    const groupId: string | null = requestBody.groupId || null
    const roleGroup: 'ADMIN' | 'USER' = requestBody.roleGroup === 'ADMIN' ? 'ADMIN' : 'USER'
    const permissionFlags = requestBody.permissionFlags || null
    const criarGrupoComNome: string | null = requestBody.criarGrupoComNome || null

    if (tipoUsuario === 'membro') {
      return new Response(
        JSON.stringify({ success: false, error: 'O sistema não permite mais a criação de membros em grupos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const hoje = new Date().toISOString().split('T')[0]

    const diasMap: Record<string, number> = { anual: 365, mensal: 30 }

    } else if (requestBody.planoExpiraEm) {
    }

    const isImersao = false


    // Verificar se o usuário existe no Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users?.find(u => u.email === email)

    // Verificar perfil
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, ativo')
      .eq('email', email)
      .maybeSingle()

    // Para MEMBRO: não preenche campos de plano (herda do mestre)
    const planoFields: Record<string, any> = tipoUsuario === 'membro'
      ? { origem_criacao: 'admin_membro' }
      : {
          origem_criacao: isImersao ? 'imersao' : 'admin',
        }


    // Marca onboarding_concluido=true para membros (não precisam passar pelo onboarding)
    if (tipoUsuario === 'membro') {
      planoFields.onboarding_concluido = true
      planoFields.onboarding_iniciado = true
    }

    let userId: string

    if (existingAuthUser && existingProfile) {
      userId = existingAuthUser.id
      if (existingProfile.ativo === true) {
        await supabaseAdmin
          .from('profiles')
          .update({ ...planoFields, updated_at: new Date().toISOString() })
          .eq('id', userId)
      } else {
        // Reativar
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
        console.log('Usuário reativado:', userId)
      }
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
          ...planoFields,
          primeiro_acesso: true,
        })
    } else {
      // Novo usuário - criar com senha temporária
      const senhaTemporaria = crypto.randomUUID()
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senhaTemporaria,
        email_confirm: true,
        user_metadata: { nome_completo: nomeCompleto, nome_confeitaria: nomeConfeitaria }
      })
      if (createError || !createData.user) throw createError || new Error('Erro ao criar usuário')
      userId = createData.user.id

      await new Promise(resolve => setTimeout(resolve, 2000))
      await supabaseAdmin
        .from('profiles')
        .update({ ...planoFields, primeiro_acesso: true })
        .eq('id', userId)

      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${(Deno.env.get('SITE_URL') || 'https://www.spaflordebaunilha.com.br').replace(/\/+$/, '')}/dashboard`
        }
      })
      const magicLink = linkData?.properties?.action_link || null
    }

    // === Vínculo com Grupo ===
    let finalGroupId = groupId
    if (tipoUsuario === 'mestre') {
      // Verificar se já existe um grupo onde o usuário é mestre
      const { data: existingGroup } = await supabaseAdmin
        .from('groups')
        .select('id')
        .eq('master_user_id', userId)
        .maybeSingle()

      if (existingGroup) {
        console.log('Mestre já possui grupo, mantendo o atual:', existingGroup.id)
        finalGroupId = existingGroup.id
      } else {
        // Cria um novo grupo apenas se não existir
        const nomeGrupo = (criarGrupoComNome || nomeConfeitaria || nomeCompleto || email || 'Novo Grupo').trim()
        const { data: novoGrupo, error: errGrupo } = await supabaseAdmin
          .from('groups')
          .insert({
            name: nomeGrupo,
            created_by_user_id: userId,
            master_user_id: userId,
            is_active: true,
          })
          .select('id')
          .single()
        
        if (errGrupo) {
          console.error('Erro ao criar grupo:', errGrupo)
        } else {
          finalGroupId = novoGrupo.id
        }
      }
    }

    if (finalGroupId) {
      const ADMIN_FLAGS = {
        financeiro_view: true, financeiro_edit: true,
        metas_view: true, metas_edit: true,
        tarefas_view: true, tarefas_edit: true,
        cadastros_view: true, cadastros_edit: true,
        receitas_view: true, receitas_edit: true,
        encomendas_view: true, encomendas_edit: true,
        precificacao_view: true, precificacao_edit: true,
        admin_users_manage: true,
      }
      const USER_FLAGS = {
        financeiro_view: true, financeiro_edit: false,
        metas_view: true, metas_edit: false,
        tarefas_view: true, tarefas_edit: false,
        cadastros_view: true, cadastros_edit: false,
        receitas_view: true, receitas_edit: false,
        encomendas_view: true, encomendas_edit: false,
        precificacao_view: true, precificacao_edit: false,
        admin_users_manage: false,
      }
      const effectiveRole = tipoUsuario === 'mestre' ? 'ADMIN' : roleGroup
      const flags = effectiveRole === 'ADMIN' ? ADMIN_FLAGS : (permissionFlags || USER_FLAGS)

      await supabaseAdmin.from('user_group_roles').upsert(
        {
          user_id: userId,
          group_id: finalGroupId,
          role_group: effectiveRole,
          permission_flags: flags,
          is_active: true,
        },
        { onConflict: 'user_id,group_id' }
      )

      // Define sessão ativa
      await supabaseAdmin.from('user_active_session').upsert(
        { user_id: userId, active_group_id: finalGroupId, mode: 'group' },
        { onConflict: 'user_id' }
      )
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
    })

    // Record plan history
    await supabaseAdmin.from('historico_planos').insert({
      user_id: userId,
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
  _magicLink?: string | null
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY não configurada - email de boas-vindas não enviado')
    return
  }

  const nomeDisplay = escapeHtml(nome || 'Confeiteira')
  const emailSafe = escapeHtml(email)
  const planoNome =
    : 'Flor de Baunilha Lite'


  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <p>Olá, ${nomeDisplay}!</p>
      <p>Sua conta foi criada. Veja como acessar a plataforma agora:</p>
      <ol>
        <li>Acesse <a href="https://www.spaflordebaunilha.com.br" style="color: #5B1A2B;">www.spaflordebaunilha.com.br</a></li>
        <li>Clique em <strong>"Esqueci minha senha"</strong></li>
        <li>Digite o email <strong>${emailSafe}</strong> para receber o link de acesso</li>
      </ol>
      <p><strong>Seu plano:</strong> ${planoNome}</p>
      ${''}
      <p>Qualquer dúvida, responda este email ou acesse o suporte através do e-mail <a href="mailto:ola@spaflordebaunilha.com.br" style="color: #5B1A2B;">ola@spaflordebaunilha.com.br</a></p>
      <br/>
      <p>Spa Flor de Baunilha</p>
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
        from: 'Spa Flor de Baunilha <noreply@spaflordebaunilha.com.br>',
        to: [email],
        subject: 'Seu acesso ao Spa Flor de Baunilha está pronto',
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
