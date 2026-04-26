import { createClient } from "@supabase/supabase-js";

// Client-side Supabase. Usa anon key — RLS protege dados sensíveis.
// Setup quando Supabase project for criado:
//   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: true } })
    : null;
