"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "@/lib/auth/server";
import type { Unit } from "@/types/database";
import { getBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: CurrentUser | null;
  units: Unit[];
  unitId: string | null;
  setUnitId: (id: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORED_UNIT_KEY = "kph_unit_id";

/**
 * Provider montado no layout do dashboard. Recebe o user (já validado pelo
 * proxy.ts + server-fetched no layout) e os units acessíveis.
 *
 * unitId é persistido em localStorage. Se nunca setado, escolhe a primeira
 * unit que o user tem role.
 */
export function AuthProvider({
  user,
  units,
  children,
}: {
  user: CurrentUser | null;
  units: Unit[];
  children: React.ReactNode;
}) {
  const [unitId, setUnitIdState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORED_UNIT_KEY);
    const valid = stored && units.some((u) => u.id === stored) ? stored : null;
    const fallback = units[0]?.id ?? null;
    setUnitIdState(valid ?? fallback);
  }, [units]);

  const setUnitId = (id: string) => {
    setUnitIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORED_UNIT_KEY, id);
    }
  };

  const signOut = async () => {
    // Centralizado em rota — limpa cookies via Server Action e redireciona.
    if (typeof window !== "undefined") {
      window.location.href = "/auth/sign-out";
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, units, unitId, setUnitId, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, units, unitId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth: precisa estar dentro de <AuthProvider>");
  }
  return ctx;
}

/** Roles do user atual (array). */
export function useRoles() {
  return useAuth().user?.roles ?? [];
}

/** Unit selecionada hoje (objeto Unit completo) e o setter. */
export function useUnit() {
  const { units, unitId, setUnitId } = useAuth();
  const unit = units.find((u) => u.id === unitId) ?? null;
  return { unit, units, setUnit: setUnitId };
}

/** Helper barato pra checar role no client (não substitui RLS no servidor). */
export function useHasRole(allowed: ReadonlyArray<string>): boolean {
  const roles = useRoles();
  return roles.some((r) => allowed.includes(r.role));
}

/** Acesso direto ao Supabase no browser (com sessão atual). */
export function useSupabase() {
  // Recriar o client em cada render é barato (singleton interno do @supabase/ssr).
  return getBrowserClient();
}
