import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { create as createJwt } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

const PLANO_MAP: Record<string, string> = {
  base: 'lite',
  negocio: 'business',
  aluna_imersao: 'business',
  start: 'business',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SSO_SHARED_SECRET = Deno.env.get('SSO_SHARED_SECRET')
    const DOCE_BASE_URL = Deno.env.get('DOCE_BASE_URL')
    const SITE_URL = Deno.env.get('SITE_URL') || ''
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!SSO_SHARED_SECRET || !DOCE_BASE_URL) {
      console.error('[gerar-token-sso-doce] Config ausente', {
        hasSecret: !!SSO_SHARED_SECRET,
        hasBaseUrl: !!DOCE_BASE_URL,
      })
      return jsonResponse({ error: 'sso_not_configured' }, 500)
    }

    // ===== Auth =====
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return jsonResponse({ error: 'unauthorized' }, 401)
    }
    const token = authHeader.slice(7).trim()

    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    const userId = claimsData?.claims?.sub
    if (claimsError || !userId) {
      return jsonResponse({ error: 'unauthorized' }, 401)
    }

    // ===== Perfil =====
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email, nome_completo, cpf, plano_id, ativo')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      console.error('[gerar-token-sso-doce] Perfil não encontrado', { userId, profileError })
      return jsonResponse({ error: 'profile_not_found' }, 404)
    }
    if (profile.ativo === false) {
      return jsonResponse({ error: 'account_disabled' }, 403)
    }

    const email = profile.email
    const nome = profile.nome_completo ?? null
    const cpf = profile.cpf ?? null
    const plan = PLANO_MAP[profile.plano_id ?? ''] || 'free_limited'

    // ===== JWT =====
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 300
    const jti = crypto.randomUUID()

    const origin = req.headers.get('origin') || SITE_URL || ''
    const return_url = `${origin.replace(/\/$/, '')}/sso-return`

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SSO_SHARED_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    )

    const jwt = await createJwt(
      { alg: 'HS256', typ: 'JWT' },
      { email, nome, cpf, produto: 'planejamento', plan, return_url, jti, iat, exp },
      key,
    )

    // ===== Log anti-replay =====
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null
    const userAgent = req.headers.get('user-agent') || null

    const { error: logError } = await admin.from('sso_token_log').insert({
      jti,
      email,
      direction: 'saida', // CHECK constraint: 'saida' | 'entrada' (outgoing → saida)
      expires_at: new Date(exp * 1000).toISOString(),
      ip,
      user_agent: userAgent,
    })
    if (logError) {
      console.error('[gerar-token-sso-doce] Falha ao registrar jti', logError)
      return jsonResponse({ error: 'log_failed' }, 500)
    }

    const redirect_url = `${DOCE_BASE_URL.replace(/\/$/, '')}/auth/sso?token=${encodeURIComponent(jwt)}`
    return jsonResponse({ redirect_url })
  } catch (err) {
    console.error('[gerar-token-sso-doce] Erro inesperado:', err instanceof Error ? err.message : err)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
})
