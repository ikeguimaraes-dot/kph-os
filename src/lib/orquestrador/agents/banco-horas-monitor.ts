import { createServiceClient } from '@/lib/supabase/server'
import { sendDiscordMessage } from '@/lib/discord/notify'

// 40 horas * 60 minutos
const SALDO_THRESHOLD_MINUTOS = 2400
const JOB_SLUG = 'banco_horas_monitor'

function minutesToHHMM(minutos: number): string {
  const h = Math.floor(Math.abs(minutos) / 60)
  const m = Math.abs(minutos) % 60
  const sign = minutos < 0 ? '-' : ''
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function runBancoHorasMonitor(): Promise<{ created: number }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Supabase indisponível')

  const { data: job } = await (supabase as any)
    .from('hos_jobs')
    .select('id')
    .eq('slug', JOB_SLUG)
    .eq('is_active', true)
    .single()

  if (!job) throw new Error('Job banco_horas_monitor não encontrado')

  // Saldos acima do threshold, apenas colaboradores ativos
  const { data: saldos, error } = await (supabase as any)
    .from('time_bank_balance')
    .select(`
      id,
      employee_id,
      saldo_minutos,
      ultimo_calculo,
      employee:employees!inner(nome, sobrenome, funcao, ativo, unit:units(name))
    `)
    .eq('employee.ativo', true)
    .gt('saldo_minutos', SALDO_THRESHOLD_MINUTOS)

  if (error) throw new Error(error.message)

  // Runs abertos para o mesmo job — deduplicação por employee_id no payload
  const { data: openRuns } = await (supabase as any)
    .from('hos_runs')
    .select('payload')
    .eq('job_id', job.id)
    .in('status', ['pending', 'awaiting_approval'])

  const openEmployeeIds = new Set<string>(
    (openRuns ?? []).map((r: any) => r.payload?.employee_id as string)
  )

  let created = 0

  for (const s of saldos ?? []) {
    if (openEmployeeIds.has(s.employee_id)) continue

    const emp = s.employee
    const nomeCompleto = [emp?.nome, emp?.sobrenome].filter(Boolean).join(' ')
    const unidade = emp?.unit?.name ?? 'N/A'
    const funcao = emp?.funcao ?? 'N/A'
    const saldoHHMM = minutesToHHMM(s.saldo_minutos)
    const saldoHoras = (s.saldo_minutos / 60).toFixed(1)
    const title = `🕐 ${nomeCompleto} — banco de horas ${saldoHHMM} (limite: 40h)`

    const { error: insertErr } = await (supabase as any)
      .from('hos_runs')
      .insert({
        job_id: job.id,
        status: 'awaiting_approval',
        triggered_by: 'cron',
        title,
        payload: {
          employee_id: s.employee_id,
          nome: nomeCompleto,
          funcao,
          unidade,
          saldo_minutos: s.saldo_minutos,
          saldo_horas: saldoHoras,
          saldo_formatado: saldoHHMM,
          threshold_horas: 40,
          ultimo_calculo: s.ultimo_calculo,
        },
        logs: [{ ts: new Date().toISOString(), msg: title }],
      })

    if (!insertErr) {
      openEmployeeIds.add(s.employee_id)
      created++
    }
  }

  if (created > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kph-os.vercel.app'
    await sendDiscordMessage(
      `🕐 **Banco de Horas Monitor** — ${created} colaborador(es) com saldo acima de 40h detectado(s).\n` +
        `Acesse o painel para revisar: ${baseUrl}/orquestrador`
    )
  }

  return { created }
}
