import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const event = payload.event
    const email = payload.data?.buyer?.email?.toLowerCase()
    
    if (!email) throw new Error('Email not found in payload')

    console.log(`Processando evento Hotmart: ${event} para ${email}`)

    if (event === 'PURCHASE_APPROVED' || event === 'SUBSCRIPTION_RENEWAL') {
      // Just ensure the user is active
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      const user = users.find(u => u.email?.toLowerCase() === email)
      
      if (user) {
        await supabaseAdmin.from('profiles').update({ ativo: true }).eq('id', user.id)
      } else {
        // Use existing criar-usuario logic via internal call or just replicate
        console.log('Usuário não encontrado, aguardando criação manual ou fluxo alternativo')
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
