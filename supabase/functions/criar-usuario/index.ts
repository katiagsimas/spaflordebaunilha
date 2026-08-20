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

    const requestBody = await req.json()
    const { email, nomeCompleto, nomeConfeitaria, tipoUsuario, role } = requestBody
    const roleGroup = requestBody.roleGroup || 'ADMIN'
    const hoje = new Date().toISOString().split('T')[0]

    // 1. Auth check
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError
    
    let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    let userId = user?.id
    let magicLink = null

    if (!userId) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nome_completo: nomeCompleto }
      })
      if (createError) throw createError
      userId = newUser.user.id
      
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback` }
      })
      magicLink = linkData?.properties?.action_link
    }

    // 2. Profile and Group
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
    
    if (!profile) {
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        nome_completo: nomeCompleto,
        nome_confeitaria: nomeConfeitaria,
        ativo: true
      })
    } else {
      await supabaseAdmin.from('profiles').update({ ativo: true }).eq('id', userId)
    }

    if (tipoUsuario === 'mestre') {
      const { data: newGroup } = await supabaseAdmin.from('groups').insert({
        name: nomeConfeitaria || `Spa de ${nomeCompleto || email}`,
        master_user_id: userId
      }).select().single()
      
      if (newGroup) {
        await supabaseAdmin.from('user_group_roles').insert({
          user_id: userId,
          group_id: newGroup.id,
          role_group: 'ADMIN'
        })
        await supabaseAdmin.from('profiles').update({ owner_group_id: newGroup.id }).eq('id', userId)
      }
    }

    // 3. Admin Log
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'criou_usuario',
      usuario_afetado_id: userId,
      usuario_afetado_email: email,
      detalhes: { nomeCompleto, nomeConfeitaria, tipoUsuario }
    })

    return new Response(JSON.stringify({ success: true, userId }), {
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
