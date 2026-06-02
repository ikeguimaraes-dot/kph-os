// Loader server-side para o Orquestrador.
// hos_jobs        = catálogo de tipos (existente, read-only)
// orquestrador_jobs = histórico de execuções (migration 068)

import { createSupabaseServerClient } from "@kph/db/supabase/server";

export type JobType =
  | "deploy_prod"
  | "code_review"
  | "qa_preview"
  | "data_sync"
  | "alert_generated"
  | "feedback_received"
  | "insight_generated"
  | "learning_machine_weekly";

export type JobStatus = "pending" | "running" | "success" | "error";

export type HosJob = {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

/** Carrega os últimos 100 jobs do orquestrador_jobs (histórico de execuções). */
export async function loadJobs(): Promise<HosJob[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("orquestrador_jobs")
      .select("id, type, status, payload, result, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return null;
    return (data ?? []) as HosJob[];
  } catch {
    return null;
  }
}

/** Insere um novo job no histórico de execuções. */
export async function insertJob(
  type: JobType,
  payload: Record<string, unknown>,
  status: JobStatus = "pending",
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("orquestrador_jobs")
      .insert({ type, status, payload });
  } catch {
    // silencioso — inserção de job nunca deve quebrar o caller
  }
}
