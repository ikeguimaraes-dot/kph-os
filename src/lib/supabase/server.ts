import { createClient } from "@supabase/supabase-js";

// Server-side Supabase para Server Components / Server Actions.
// Atualmente usa apenas anon key (sem cookies de sessão) — auth real chega na Fase 0/Dia 3.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
