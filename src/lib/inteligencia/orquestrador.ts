// Loader server-side para o Orquestrador.
// hos_jobs e hos_runs usam (supabase as any) — ver CLAUDE.md §5.5.

import { createSupabaseServerClient } from "@kph/db/supabase/server";

export type JobType =
  | "deploy_prod"
  | "code_review"
  | "qa_preview"
  | "data_sync"
  | "alert_generated"
  | "feedback_received"
  | "insight_generated";

export type JobStatus = "pending" | "running" | "success" | "error";

export type HosJob = {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

/** Carrega os últimos 100 jobs do orquestrador. */
export async function loadJobs(): Promise<HosJob[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("hos_jobs")
      .select("id, type, status, payload, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return null;
    return (data ?? []) as HosJob[];
  } catch {
    return null;
  }
}

/** Insere um novo job no orquestrador. */
export async function insertJob(
  type: JobType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("hos_jobs")
      .insert({ type, status: "pending", payload });
  } catch {
    // silencioso — inserção de job nunca deve quebrar o caller
  }
}
