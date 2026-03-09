import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${data}.${sigB64}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const ssoSecret = Deno.env.get("SSO_SECRET");

    if (!supabaseUrl || !anonKey || !ssoSecret) {
      return new Response(JSON.stringify({ error: "Configuração incompleta." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Não autorizado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await createJWT(
      { email: user.email, iat: now, exp: now + 300 }, // 5 minutos
      ssoSecret
    );

    return new Response(
      JSON.stringify({ token, redirect_url: `https://umbrelladoce.lovable.app/sso-retorno?token=${token}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
