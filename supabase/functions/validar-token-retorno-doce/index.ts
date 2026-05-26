import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { verify as verifyJwt } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const GENERIC_INVALID = { error: 'Token inválido' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const SSO_SHARED_SECRET = Deno.env.get('SSO_SHARED_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!SSO_SHARED_SECRET) {
      console.error('[validar-token-retorno-doce] SSO_SHARED_SECRET ausente')
      return jsonResponse({ error: 'sso_not_configured' }, 500)
    }

    // ===== Body =====
    let body: { token?: unknown }
    try {
      body = await req.json()
    } catch {
      return jsonResponse(GENERIC_INVALID, 400)
    }
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    if (!token) return jsonResponse(GENERIC_INVALID, 400)

    // ===== Verify JWT (HS256) =====
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SSO_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    )

    let payload: Record<string, unknown>
    try {
      payload = (await verifyJwt(token, key)) as Record<string, unknown>
    } catch (err) {
      console.warn('[validar-token-retorno-doce] assinatura inválida:', err instanceof Error ? err.message : err)
      return jsonResponse(GENERIC_INVALID, 401)
    }

    const fonte = typeof payload.fonte === 'string' ? payload.fonte : ''
    const produto = typeof payload.produto === 'string' ? payload.produto : ''
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : ''
    const sub = typeof payload.sub === 'string' ? payload.sub : ''
    const iat = typeof payload.iat === 'number' ? payload.iat : 0
    const exp = typeof payload.exp === 'number' ? payload.exp : 0
    const nowSec = Math.floor(Date.now() / 1000)

    // Aceita dois formatos de retorno:
    //  1) Legado interno: { fonte: 'doce', jti, email, exp }
    //  2) Spec Planner DOCE: { produto: 'planejamento', email, sub, iat, exp }
    let jti = typeof payload.jti === 'string' ? payload.jti : ''
    const isPlannerSpec = produto === 'planejamento'
    if (isPlannerSpec && !jti && sub && iat) {
      jti = `planejamento:${sub}:${iat}`
    }

    const fonteValida = fonte === 'doce' || isPlannerSpec
    if (!fonteValida || !jti || !email || !exp || exp <= nowSec) {
      console.warn('[validar-token-retorno-doce] claims inválidos', {
        fonte, produto, hasJti: !!jti, hasEmail: !!email, exp, nowSec,
      })
      return jsonResponse(GENERIC_INVALID, 401)
    }

    // ===== Anti-replay =====
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null
    const userAgent = req.headers.get('user-agent') || null

    const { data: existing, error: lookupError } = await admin
      .from('sso_token_log')
      .select('id')
      .eq('jti', jti)
      .maybeSingle()

    if (lookupError) {
      console.error('[validar-token-retorno-doce] falha consulta jti:', lookupError.message)
      return jsonResponse({ error: 'internal_error' }, 500)
    }
    if (existing) {
      console.warn('[validar-token-retorno-doce] replay detectado', { jti, email, ip })
      return jsonResponse({ error: 'replay_detected' }, 403)
    }

    const { error: insertError } = await admin.from('sso_token_log').insert({
      jti,
      email,
      direction: 'entrada', // incoming
      used_at: new Date().toISOString(),
      expires_at: new Date(exp * 1000).toISOString(),
      ip,
      user_agent: userAgent,
    })
    if (insertError) {
      // Pode ser race de unique → trate como replay
      if ((insertError as any).code === '23505') {
        return jsonResponse({ error: 'replay_detected' }, 403)
      }
      console.error('[validar-token-retorno-doce] falha insert jti:', insertError.message)
      return jsonResponse({ error: 'internal_error' }, 500)
    }

    // ===== Usuário existe? =====
    // Usa função SQL SECURITY DEFINER (admin.auth.admin.listUsers não suporta filter por email no supabase-js)
    const { data: userIdData, error: lookupUserError } = await admin.rpc(
      'get_user_id_by_email',
      { _email: email },
    )
    if (lookupUserError) {
      console.error('[validar-token-retorno-doce] falha get_user_id_by_email:', lookupUserError.message)
      return jsonResponse({ error: 'internal_error' }, 500)
    }
    if (!userIdData) {
      console.warn('[validar-token-retorno-doce] usuário não encontrado para email:', email)
      return jsonResponse(
        { error: 'user_not_found', message: 'Sua conta do Planner ainda não está vinculada à Caixa de Açúcar' },
        404,
      )
    }

    // ===== Magic link =====
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkError || !linkData?.properties?.action_link) {
      console.error('[validar-token-retorno-doce] falha generateLink:', linkError?.message)
      return jsonResponse({ error: 'internal_error' }, 500)
    }

    return jsonResponse({
      action_link: linkData.properties.action_link,
      email,
    })
  } catch (err) {
    console.error('[validar-token-retorno-doce] erro inesperado:', err instanceof Error ? err.message : err)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
})
