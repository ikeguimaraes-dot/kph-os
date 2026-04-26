import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Server-side Supabase para Server Components / Server Actions.
// Sem cookies de sessão por enquanto — auth completa chega na Fase 0/Dia 3.
export function createServerClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Cliente com service role — bypassa RLS. Usar APENAS em Server Actions / Edge
// Functions de confiança (ex: trigger de audit_log, jobs internos).
// NUNCA expor SUPABASE_SERVICE_ROLE_KEY no bundle do client.
export function createServiceClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
