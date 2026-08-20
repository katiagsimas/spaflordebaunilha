import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'
import { escapeHtml } from '../_shared/escapeHtml.ts'

// IP-based rate limiting (em memória, best-effort entre reinícios)
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5
const rateBuckets = new Map<string, number[]>()

function checarRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const agora = Date.now()
  const lista = (rateBuckets.get(ip) || []).filter(ts => agora - ts < RATE_WINDOW_MS)
  if (lista.length >= RATE_MAX) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (agora - lista[0])) / 1000)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  }
  lista.push(agora)
  rateBuckets.set(ip, lista)
  return { allowed: true, retryAfter: 0 }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const limite = checarRateLimit(ip)
    if (!limite.allowed) {
      return new Response(
        JSON.stringify({ error: 'rate_limit_exceeded', retry_after: limite.retryAfter }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(limite.retryAfter),
          },
        }
      )
    }

    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.caixadeacucar.com.br').replace(/\/+$/, '')

    // Gerar link de recuperação
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
    })

    if (linkError) {
      console.error('Erro ao gerar link:', linkError)
      // Não revelar se o email existe ou não
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Extrair token_hash da action_link gerada pelo Supabase
    const actionLink = linkData?.properties?.action_link
    if (!actionLink || !resendApiKey) {
      console.warn('Link ou RESEND_API_KEY ausente')
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Parsear o token_hash da URL do Supabase
    const actionUrl = new URL(actionLink)
    const tokenHash = actionUrl.searchParams.get('token')
    const type = actionUrl.searchParams.get('type') || 'recovery'

    if (!tokenHash) {
      console.error('Token não encontrado na action_link')
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Construir URL diretamente para o domínio personalizado (bypassa redirect do Supabase)
    const recoveryLink = `${siteUrl}/auth/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`

    // Buscar nome do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome_completo')
      .eq('email', email.trim().toLowerCase())
      .single()

    const nomeDisplay = escapeHtml(profile?.nome_completo || 'Confeiteira')

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <p>Olá, ${nomeDisplay}!</p>
        <p>Recebemos uma solicitação para redefinir sua senha no Spa Flor de Baunilha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #D89B8C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Redefinir minha senha
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">Se você não solicitou essa alteração, ignore este email. O link expira em 1 hora.</p>
        <br/>
        <p>Spa Flor de Baunilha</p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Spa Flor de Baunilha <noreply@umbrelladoce.com.br>',
        to: [email.trim().toLowerCase()],
        subject: 'Redefinição de senha — Spa Flor de Baunilha',
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Erro Resend:', res.status, errBody)
    } else {
      console.log('Email de recuperação enviado para:', email)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Erro na recuperação de senha:', error)
    return new Response(
      JSON.stringify({ success: true }), // Não revelar erros internos
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
