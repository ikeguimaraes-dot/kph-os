export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", color: "var(--text)", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, padding: 32,
        background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: 16,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          KPH <span style={{ color: "var(--brand)" }}>OS</span>
        </div>
        <p style={{ marginTop: 24, color: "var(--text-2)", fontSize: 13, lineHeight: 1.6 }}>
          Auth via Supabase magic link chega no Dia 3 da Fase 0. Por enquanto a fundação está crua.
        </p>
      </div>
    </div>
  );
}
