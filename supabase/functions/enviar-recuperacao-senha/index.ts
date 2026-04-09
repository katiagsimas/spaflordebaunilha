import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Gerar link de recuperação
    const siteUrl = Deno.env.get('SITE_URL') || 'https://caixa.umbrelladoce.com.br'
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/auth/reset-password`
      }
    })

    if (linkError) {
      console.error('Erro ao gerar link:', linkError)
      // Não revelar se o email existe ou não
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const recoveryLink = linkData?.properties?.action_link
    if (!recoveryLink || !resendApiKey) {
      console.warn('Link ou RESEND_API_KEY ausente')
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Buscar nome do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome_completo')
      .eq('email', email.trim().toLowerCase())
      .single()

    const nomeDisplay = profile?.nome_completo || 'Confeiteira'

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <p>Olá, ${nomeDisplay}!</p>
        <p>Recebemos uma solicitação para redefinir sua senha no Caixa de Açúcar.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #D89B8C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Redefinir minha senha
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">Se você não solicitou essa alteração, ignore este email. O link expira em 1 hora.</p>
        <br/>
        <p>Umbrella Doce</p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Caixa de Açúcar <noreply@umbrelladoce.com.br>',
        to: [email.trim().toLowerCase()],
        subject: 'Redefinição de senha — Caixa de Açúcar',
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
