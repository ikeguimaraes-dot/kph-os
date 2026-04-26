"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Users, BookOpen, ShoppingCart,
  MessageSquare, Brain, Megaphone, ChevronDown, Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const NAV = [
  { href: "/",            label: "Dashboard",      icon: LayoutDashboard },
  { href: "/operacao",    label: "Operação",       icon: Wallet },
  { href: "/pessoas",     label: "Pessoas",        icon: Users },
  { href: "/cardapio",    label: "Cardápio",       icon: BookOpen },
  { href: "/compras",     label: "Compras",        icon: ShoppingCart },
  { href: "/cliente",     label: "Cliente",        icon: MessageSquare },
  { href: "/inteligencia", label: "Inteligência",  icon: Brain },
  { href: "/marca",       label: "Marca",          icon: Megaphone },
];

// Placeholder até Supabase ter groups/brands/units cadastrados.
const MOCK_UNITS = [
  { id: "madonna_cucina_itaim", nome: "Madonna Cucina · Itaim", brand: "Madonna" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [unit, setUnit] = useState(MOCK_UNITS[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <aside
      style={{
        width: 240, flexShrink: 0,
        background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: -0.5 }}>
          KPH <span style={{ color: "var(--brand)" }}>OS</span>
        </div>
        <div style={{
          fontSize: 10, color: "var(--text-3)", marginTop: 2,
          letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600,
        }}>
          Operations
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div ref={ref} style={{ position: "relative" }}>
          <button onClick={() => setOpen((v) => !v)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "9px 12px", color: "var(--text)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "border-color var(--t)",
          }}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700, letterSpacing: 0.8 }}>UNIDADE</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                {unit?.nome ?? "—"}
              </span>
            </span>
            <ChevronDown size={14} style={{
              color: "var(--text-3)",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform var(--t)",
            }} />
          </button>
          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
              background: "var(--surface-2)", border: "1px solid var(--border-strong)",
              borderRadius: 10, padding: 4, boxShadow: "var(--shadow-lg)",
            }}>
              {MOCK_UNITS.map((u) => {
                const active = u.id === unit?.id;
                return (
                  <button key={u.id} onClick={() => { setUnit(u); setOpen(false); }} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 8, padding: "9px 10px", background: active ? "var(--surface-3)" : "transparent",
                    border: "none", borderRadius: 6, color: "var(--text)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", textAlign: "left", transition: "background var(--t)",
                  }}>
                    <span>{u.nome}</span>
                    {active && <Check size={14} style={{ color: "var(--brand)" }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {NAV.map((it) => {
          const Icon = it.icon;
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} style={{
              position: "relative",
              display: "flex", alignItems: "center", gap: 12,
              padding: "9px 12px", borderRadius: 8,
              textDecoration: "none",
              color: active ? "var(--text)" : "var(--text-2)",
              background: active ? "var(--surface-2)" : "transparent",
              fontSize: 13, fontWeight: active ? 600 : 500,
              transition: "all var(--t)",
            }}>
              {active && (
                <span style={{
                  position: "absolute", left: -12, top: 6, bottom: 6, width: 3,
                  background: "var(--brand)", borderRadius: "0 4px 4px 0",
                }} />
              )}
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8}
                style={{ color: active ? "var(--brand)" : "currentColor" }} />
              <span style={{ flex: 1 }}>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{
        padding: "12px 14px", borderTop: "1px solid var(--sidebar-border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 99, background: "var(--brand-soft)",
            color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 13,
          }}>IK</div>
          <span style={{
            position: "absolute", right: -1, bottom: -1,
            width: 10, height: 10, borderRadius: 99,
            background: "#22C55E", border: "2px solid var(--sidebar)",
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Ike</div>
          <div style={{ fontSize: 10, color: "var(--text-3)" }}>Founder · KPH</div>
        </div>
      </div>
    </aside>
  );
}
