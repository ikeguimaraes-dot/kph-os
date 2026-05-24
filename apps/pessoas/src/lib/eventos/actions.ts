"use server";

import { createSupabaseServerClient } from "@kph/db/supabase/server";
import type { BrandOption } from "@/lib/eventos/types";

export async function listAccessibleBrands(): Promise<BrandOption[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, color, group_id")
      .eq("active", true)
      .order("name")
      .returns<BrandOption[]>();
    if (error) {
      console.error("[listAccessibleBrands]", error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("[listAccessibleBrands] exceção:", e);
    return [];
  }
}
