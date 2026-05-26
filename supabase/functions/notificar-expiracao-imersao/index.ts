import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'
import { escapeHtml } from '../_shared/escapeHtml.ts'

const URL_UPGRADE = 'https://upcaixa.umbrelladoce.com.br'
const FROM = 'Caixa de Açúcar <noreply@umbrelladoce.com.br>'
const DIAS_ALVO = [7, 3, 1]

interface Aluna {
  id: string
  email: string
  nome_completo: string | null
  plano_fim: string
  imersao_turma: string | null
}

function brToday(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return fmt.format(new Date())
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function tituloAluna(dias: number): string {
  if (dias === 1) return 'Seu acesso à Imersão termina amanhã!'
  if (dias === 3) return 'Faltam 3 dias do seu acesso à Imersão'
  return 'Faltam 7 dias do seu acesso à Imersão'
}

function htmlAluna(nome: string, dias: number): string {
  const nomeSafe = escapeHtml(nome || 'Confeiteira')
  const titulo = tituloAluna(dias)
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background:#FDF6EE; padding: 32px 24px; color:#121212;">
      <div style="background:#5B1A2B; color:#FFF9F5; padding:24px; border-radius:12px 12px 0 0; text-align:center;">
        <h1 style="margin:0; font-size:22px;">${titulo}</h1>
      </div>
      <div style="background:#FFF9F5; padding:28px 24px; border-radius:0 0 12px 12px; line-height:1.6;">
        <p>Olá, <strong>${nomeSafe}</strong>!</p>
        <p>Seu acesso ao <strong>Caixa de Açúcar</strong> liberado pela Imersão <em>A Receita que Faltava</em> termina em <strong>${dias} dia${dias > 1 ? 's' : ''}</strong>.</p>
        <p>Para continuar usando o sistema sem perder seus cadastros, fichas técnicas e histórico, renove agora seu acesso anual:</p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${URL_UPGRADE}" style="background:#C9A14A; color:#121212; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">
            Renovar acesso agora
          </a>
        </div>
        <p style="font-size:13px; color:#5B1A2B;">Após o término, sua conta será desativada, mas seus dados ficam guardados — basta renovar para reativar tudo.</p>
        <p>Estamos aqui se precisar 💛</p>
        <p style="margin-top:24px;"><strong>Equipe Caixa de Açúcar</strong><br/><span style="color:#666; font-size:12px;">by Umbrella Doce</span></p>
      </div>
    </div>
  `
}

function htmlAdmin(grupos: Record<number, Aluna[]>): string {
  const renderGrupo = (dias: number, alunas: Aluna[]) => {
    if (!alunas.length) return ''
    const rows = alunas.map(a => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;">${escapeHtml(a.nome_completo || '-')}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">${escapeHtml(a.email)}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">${escapeHtml(a.imersao_turma || '-')}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">${a.plano_fim}</td>
      </tr>
    `).join('')
    return `
      <h3 style="color:#5B1A2B; margin:24px 0 8px;">D-${dias} (${alunas.length} aluna${alunas.length > 1 ? 's' : ''})</h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <thead><tr style="background:#FDF6EE;">
          <th style="padding:8px; text-align:left;">Nome</th>
          <th style="padding:8px; text-align:left;">E-mail</th>
          <th style="padding:8px; text-align:left;">Turma</th>
          <th style="padding:8px; text-align:left;">Expira em</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `
  }
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:700px; margin:0 auto; padding:32px 24px; color:#121212;">
      <h1 style="color:#5B1A2B;">Resumo diário — Alunas da Imersão expirando</h1>
      <p>Estas alunas têm o plano <strong>Aluna da Imersão</strong> próximo do vencimento. Elas já receberam o aviso automático por e-mail.</p>
      ${renderGrupo(7, grupos[7] || [])}
      ${renderGrupo(3, grupos[3] || [])}
      ${renderGrupo(1, grupos[1] || [])}
      <p style="margin-top:32px; font-size:12px; color:#666;">Caixa de Açúcar · notificações automáticas</p>
    </div>
  `
}

async function enviarEmail(resendKey: string, to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    return { ok: false, error: `${res.status} ${err}` }
  }
  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const emailAdmin = Deno.env.get('EMAIL_ADMIN_IMERSAO')

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY ausente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const hoje = brToday()
    const datasAlvo = DIAS_ALVO.map(d => ({ dias: d, data: addDaysISO(hoje, d) }))

    const { data: alunas, error: qErr } = await admin
      .from('profiles')
      .select('id, email, nome_completo, plano_fim, imersao_turma')
      .eq('plano_id', 'aluna_imersao')
      .eq('ativo', true)
      .in('plano_fim', datasAlvo.map(d => d.data))

    if (qErr) {
      console.error('Erro ao buscar alunas:', qErr)
      return new Response(JSON.stringify({ error: qErr.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const grupos: Record<number, Aluna[]> = { 7: [], 3: [], 1: [] }
    for (const a of (alunas || []) as Aluna[]) {
      const match = datasAlvo.find(d => d.data === a.plano_fim)
      if (match) grupos[match.dias].push(a)
    }

    let enviadas = 0
    let puladas = 0
    let falhas = 0

    for (const dias of DIAS_ALVO) {
      for (const aluna of grupos[dias]) {
        // Tenta inserir no log primeiro (unique constraint garante idempotência por dia BR)
        const { error: logErr } = await admin
          .from('imersao_notificacoes_log')
          .insert({
            user_id: aluna.id,
            dias_restantes: dias,
            tipo: 'aluna',
            email_destinatario: aluna.email,
          })

        if (logErr) {
          // Provavelmente já enviado hoje
          puladas++
          continue
        }

        const result = await enviarEmail(
          resendKey,
          aluna.email,
          tituloAluna(dias) + ' — Caixa de Açúcar',
          htmlAluna(aluna.nome_completo || '', dias),
        )

        if (!result.ok) {
          falhas++
          await admin.from('imersao_notificacoes_log').update({ erro: result.error })
            .eq('user_id', aluna.id)
            .eq('dias_restantes', dias)
            .eq('tipo', 'aluna')
            .gte('enviado_em', new Date(Date.now() - 60000).toISOString())
        } else {
          enviadas++
        }
      }
    }

    // E-mail consolidado para a administradora (uma vez por dia, se houver alunas)
    const totalAlunas = grupos[7].length + grupos[3].length + grupos[1].length
    let adminEnviado = false
    if (emailAdmin && totalAlunas > 0) {
      const { error: logAdmErr } = await admin
        .from('imersao_notificacoes_log')
        .insert({
          user_id: null,
          dias_restantes: 0,
          tipo: 'admin',
          email_destinatario: emailAdmin,
        })

      if (!logAdmErr) {
        const result = await enviarEmail(
          resendKey,
          emailAdmin,
          `Resumo Imersão — ${totalAlunas} aluna${totalAlunas > 1 ? 's' : ''} expirando`,
          htmlAdmin(grupos),
        )
        adminEnviado = result.ok
        if (!result.ok) {
          await admin.from('imersao_notificacoes_log').update({ erro: result.error })
            .eq('tipo', 'admin')
            .is('user_id', null)
            .gte('enviado_em', new Date(Date.now() - 60000).toISOString())
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        hoje_br: hoje,
        encontradas: { d7: grupos[7].length, d3: grupos[3].length, d1: grupos[1].length },
        enviadas, puladas, falhas,
        admin_enviado: adminEnviado,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('Erro notificar-expiracao-imersao:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
