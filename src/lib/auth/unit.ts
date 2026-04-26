import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Unit } from "@/types/database";

const COOKIE_KEY = "kph_unit_id";

/**
 * Resolve a unit selecionada (server-side) lendo o cookie escrito pelo
 * AuthProvider. Se cookie ausente ou inválido, cai pra primeira unit acessível.
 */
export async function getCurrentUnit(): Promise<Unit | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const cookieStore = await cookies();
  const cookieId = cookieStore.get(COOKIE_KEY)?.value;

  if (cookieId) {
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("id", cookieId)
      .eq("active", true)
      .maybeSingle();
    if (data) return data as Unit;
  }

  // Fallback: primeira unit acessível.
  const { data } = await supabase
    .from("units")
    .select("*")
    .eq("active", true)
    .order("name")
    .limit(1);
  const first = data?.[0];
  return first ? (first as Unit) : null;
}
