import { AuthProvider } from "@kph/auth/context";
import { requireUser } from "@kph/auth/server";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import type { Unit } from "@kph/db/types/database";
import { Sidebar } from "@kph/ui/sidebar";
import { PageViewTracker } from "@/components/shell/PageViewTracker";

export const dynamic = "force-dynamic";

export default async function InteligenciaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const units = await loadAccessibleUnits();

  return (
    <AuthProvider user={user} units={units}>
      <PageViewTracker />
      {/* Skip link — WCAG 2.4.1 Bypass Blocks */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: -48,
          left: 0,
          background: "#C4622D",
          color: "#fff",
          padding: "10px 18px",
          zIndex: 9999,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
          borderRadius: "0 0 8px 0",
          transition: "top 0.15s",
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.top = "0"; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.top = "-48px"; }}
      >
        Pular para o conteúdo
      </a>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          style={{ flex: 1, overflowY: "auto", padding: "32px 28px", outline: "none" }}
        >
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}

async function loadAccessibleUnits(): Promise<Unit[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
