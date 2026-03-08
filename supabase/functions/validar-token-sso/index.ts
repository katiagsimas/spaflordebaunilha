import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.9/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token) return new Response(
      JSON.stringify({ error: 'Token ausente.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

    // Validar JWT
    const secret = Deno.env.get('SSO_SECRET')!
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )

    let payload: any
    try {
      payload = await verify(token, key)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar que o token é para este produto
    if (payload.produto !== 'caixa') return new Response(
      JSON.stringify({ error: 'Token não autorizado para este produto.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
    )

    // Gerar magic link para o email — cria sessão Supabase válida
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: payload.email,
      options: { redirectTo: `${Deno.env.get('SITE_URL')}/dashboard` }
    })

    if (error || !data?.properties?.hashed_token) return new Response(
      JSON.stringify({ error: 'Não foi possível gerar acesso.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )

    return new Response(
      JSON.stringify({ 
        token_hash: data.properties.hashed_token,
        nome_completo: payload.nome_completo || null 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro SSO:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
