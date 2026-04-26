import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { AuthProvider } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Unit } from "@/types/database";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // proxy.ts já redireciona — defesa em profundidade.
  const user = await requireUser();

  const units = await loadAccessibleUnits();

  return (
    <AuthProvider user={user} units={units}>
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopBar />
          <main style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}

async function loadAccessibleUnits(): Promise<Unit[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  // RLS no servidor garante que só vem o que o user pode ver.
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error || !data) return [];
  return data;
}
