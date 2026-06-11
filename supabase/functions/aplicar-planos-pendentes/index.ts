import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Promove planos pendentes (downgrade agendado) quando a vigência atual termina.
 *
 * Executado diariamente via pg_cron. Para cada profile com
 * `plano_pendente_id IS NOT NULL` e `plano_pendente_inicio <= hoje` (ou
 * plano_fim atual já expirado), aplica o plano pendente como plano corrente
 * e registra em `historico_planos` (tipo_evento = 'downgrade_aplicado').
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    const callerSecret = req.headers.get('x-cron-secret')
    const authHeader = req.headers.get('authorization') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : ''

    const autorizado =
      (!!cronSecret && callerSecret === cronSecret) ||
      (!!bearer && bearer === supabaseServiceKey)

    if (!autorizado) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const hoje = new Date().toISOString().split('T')[0]

    const { data: pendentes, error: errSel } = await supabase
      .from('profiles')
      .select('id, email, plano_id, plano_fim, plano_pendente_id, plano_pendente_tipo, plano_pendente_inicio, plano_pendente_fim')
      .not('plano_pendente_id', 'is', null)
      .lte('plano_pendente_inicio', hoje)

    if (errSel) {
      console.error('Erro ao buscar pendentes:', errSel)
      throw errSel
    }

    console.log(`Pendentes a aplicar hoje (${hoje}):`, pendentes?.length ?? 0)

    let aplicados = 0
    for (const p of pendentes ?? []) {
      const { error: errUpd } = await supabase
        .from('profiles')
        .update({
          plano_id: p.plano_pendente_id,
          plano_tipo: p.plano_pendente_tipo,
          plano_inicio: p.plano_pendente_inicio,
          plano_fim: p.plano_pendente_fim,
          ativo: true,
          plano_pendente_id: null,
          plano_pendente_tipo: null,
          plano_pendente_inicio: null,
          plano_pendente_fim: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', p.id)

      if (errUpd) {
        console.error('Erro ao aplicar pendente para', p.email, errUpd)
        continue
      }

      await supabase.from('historico_planos').insert({
        user_id: p.id,
        plano_anterior: p.plano_id,
        plano_novo: p.plano_pendente_id,
        plano_tipo_novo: p.plano_pendente_tipo,
        plano_inicio: p.plano_pendente_inicio,
        plano_fim: p.plano_pendente_fim,
        tipo_evento: 'downgrade_aplicado',
        origem: 'cron',
        observacao: `Downgrade agendado aplicado automaticamente`,
      })

      aplicados++
      console.log('Pendente aplicado:', p.email, '→', p.plano_pendente_id)
    }

    return new Response(
      JSON.stringify({ success: true, hoje, total_candidatos: pendentes?.length ?? 0, aplicados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro aplicar-planos-pendentes:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'erro' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
