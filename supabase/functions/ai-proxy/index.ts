import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

// Rate limit por IP (em memória — protege contra abuso bruto)
const rateMap = new Map<string, { count: number; resetAt: number }>()
const IP_LIMIT_PER_MIN = 30

interface AiProxyBody {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  model?: string
  temperature?: number
  max_tokens?: number
}

const ALLOWED_MODELS = new Set([
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-pro',
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ===== Rate limit por IP =====
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const now = Date.now()
    const entry = rateMap.get(ip)
    if (!entry || now >= entry.resetAt) {
      rateMap.set(ip, { count: 1, resetAt: now + 60_000 })
    } else if (entry.count >= IP_LIMIT_PER_MIN) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return new Response(
        JSON.stringify({ error: 'ip_rate_limit', retry_after_seconds: retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) } }
      )
    } else {
      entry.count++
      rateMap.set(ip, entry)
    }

    // ===== Auth =====
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'ai_not_configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const userId = claimsData.claims.sub as string

    // ===== Plano + Quota =====
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: profile } = await admin
      .from('profiles')
      .select('plano_id, ativo')
      .eq('id', userId)
      .single()

    if (!profile || profile.ativo === false) {
      return new Response(JSON.stringify({ error: 'inactive_account' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const planoId = profile.plano_id || 'base'

    const { data: quotaResult, error: quotaError } = await admin.rpc('check_and_increment_ai_quota', {
      p_user_id: userId,
      p_plano_id: planoId,
    })

    if (quotaError) {
      console.error('Erro check_and_increment_ai_quota:', quotaError)
      return new Response(JSON.stringify({ error: 'quota_check_failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const quota = quotaResult as { allowed: boolean; unlimited: boolean; requests_used: number; limit?: number; periodo: string }

    if (!quota.allowed) {
      return new Response(JSON.stringify({
        error: 'monthly_quota_exceeded',
        plano: planoId,
        limit: quota.limit,
        periodo: quota.periodo,
        message: `Limite mensal de ${quota.limit} requisições de IA atingido para o plano atual. Faça upgrade ou aguarde o próximo ciclo.`
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ===== Validação body =====
    const body = await req.json() as AiProxyBody
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'messages obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const model = body.model && ALLOWED_MODELS.has(body.model) ? body.model : 'google/gemini-2.5-flash'

    // ===== Chamada Lovable AI Gateway =====
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 2000,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('Lovable AI error:', aiResponse.status, errText)
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'ai_rate_limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'ai_credits_exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ error: 'ai_upstream_error' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const aiData = await aiResponse.json()

    // Registra tokens reais (best-effort)
    const usage = aiData.usage || {}
    if (usage.prompt_tokens || usage.completion_tokens) {
      await admin.rpc('record_ai_tokens', {
        p_user_id: userId,
        p_tokens_in: usage.prompt_tokens || 0,
        p_tokens_out: usage.completion_tokens || 0,
      })
    }

    return new Response(JSON.stringify({
      ...aiData,
      _quota: {
        requests_used: quota.requests_used,
        limit: quota.limit,
        unlimited: quota.unlimited,
        periodo: quota.periodo,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('ai-proxy erro:', err)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
