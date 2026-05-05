'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listRuns() {
  const supabase = createServiceClient()
  if (!supabase) return []
  const { data, error } = await (supabase as any)
    .from('hos_runs')
    .select('*, hos_jobs(name, slug)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function getRunDetails(id: string) {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Supabase indisponível')
  const { data, error } = await (supabase as any)
    .from('hos_runs')
    .select('*, hos_jobs(name, slug), hos_approvals(decision, feedback, created_at, user_id)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function submitHumanDecision(
  runId: string,
  decision: 'approve' | 'reject',
  feedback?: string
) {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Supabase indisponível')
  const { data: authData } = await (supabase as any).auth.getUser()
  const userId = authData?.user?.id
  await (supabase as any).from('hos_approvals').insert({
    run_id: runId,
    user_id: userId,
    decision,
    feedback
  })
  await (supabase as any).from('hos_runs')
    .update({ status: decision === 'approve' ? 'approved' : 'rejected' })
    .eq('id', runId)
  revalidatePath('/orquestrador')
}