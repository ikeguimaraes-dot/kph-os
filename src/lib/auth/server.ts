import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoleName } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string | null;
  roles: Array<{
    role: RoleName;
    unitId: string | null;
    brandId: string | null;
    groupId: string | null;
  }>;
};

/**
 * DAL — verifica sessão e carrega roles. `cache` memoiza durante uma render pass.
 * Server-only. Retorna null se sem sessão ou sem Supabase.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Pega roles do user. RLS permite SELECT do próprio user_roles.
  // Embedded select (roles!inner) não é tipado pelo nosso Database (sem relationships)
  // então cast explícito do shape esperado.
  type RoleJoinRow = {
    unit_id: string | null;
    brand_id: string | null;
    group_id: string | null;
    roles: { name: RoleName } | { name: RoleName }[] | null;
  };
  const { data: rolesData } = await supabase
    .from("user_roles")
    .select("unit_id, brand_id, group_id, roles!inner(name)")
    .eq("user_id", user.id)
    .returns<RoleJoinRow[]>();

  const roles = (rolesData ?? []).map((r) => {
    const roleObj = Array.isArray(r.roles) ? r.roles[0] : r.roles;
    return {
      role: (roleObj?.name ?? "colaborador") as RoleName,
      unitId: r.unit_id,
      brandId: r.brand_id,
      groupId: r.group_id,
    };
  });

  return {
    id: user.id,
    email: user.email ?? null,
    roles,
  };
});

/** Falha (redireciona para /login) se não houver sessão. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Falha se o user não tiver pelo menos uma das roles especificadas. */
export async function requireRole(allowed: ReadonlyArray<RoleName>): Promise<CurrentUser> {
  const user = await requireUser();
  const has = user.roles.some((r) => allowed.includes(r.role));
  if (!has) redirect("/");
  return user;
}

/** Conveniência: o user é founder? */
export function isFounder(user: CurrentUser | null): boolean {
  return !!user?.roles.some((r) => r.role === "founder");
}
