import { createServiceClient } from '@/lib/supabase/server'
import { sendDiscordMessage } from '@/lib/discord/notify'

const SCORE_THRESHOLD = 70
const JOB_SLUG = 'score_monitor'

export async function runScoreMonitor(): Promise<{ created: number }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Supabase indisponível')

  const { data: job } = await (supabase as any)
    .from('hos_jobs')
    .select('id')
    .eq('slug', JOB_SLUG)
    .eq('is_active', true)
    .single()

  if (!job) throw new Error('Job score_monitor não encontrado')

  // Colaboradores ativos com score abaixo do threshold
  const { data: employees, error } = await (supabase as any)
    .from('employees')
    .select(`
      id,
      nome,
      sobrenome,
      funcao,
      score,
      unit:units(name)
    `)
    .eq('ativo', true)
    .lt('score', SCORE_THRESHOLD)
    .not('score', 'is', null)

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

  for (const emp of employees ?? []) {
    if (openEmployeeIds.has(emp.id)) continue

    const nomeCompleto = [emp.nome, emp.sobrenome].filter(Boolean).join(' ')
    const unidade = emp.unit?.name ?? 'N/A'
    const funcao = emp.funcao ?? 'N/A'
    const delta = SCORE_THRESHOLD - emp.score
    const title = `⚠️ ${nomeCompleto} — score ${emp.score} (abaixo de ${SCORE_THRESHOLD})`

    const { error: insertErr } = await (supabase as any)
      .from('hos_runs')
      .insert({
        job_id: job.id,
        status: 'awaiting_approval',
        triggered_by: 'cron',
        title,
        payload: {
          employee_id: emp.id,
          nome: nomeCompleto,
          funcao,
          unidade,
          score: emp.score,
          threshold: SCORE_THRESHOLD,
          delta,
        },
        logs: [{ ts: new Date().toISOString(), msg: title }],
      })

    if (!insertErr) {
      openEmployeeIds.add(emp.id)
      created++
    }
  }

  if (created > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kph-os.vercel.app'
    await sendDiscordMessage(
      `⚠️ **Score Monitor** — ${created} colaborador(es) com score abaixo de ${SCORE_THRESHOLD} detectado(s).\n` +
        `Acesse o painel para revisar: ${baseUrl}/orquestrador`
    )
  }

  return { created }
}
