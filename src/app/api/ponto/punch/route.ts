// POST /api/ponto/punch — registra um punch via fetch client.
//
// Existe pra contornar bug de PWA mobile (iOS Safari standalone): Server
// Actions + revalidatePath() têm uma race condition onde o cookie de
// sessão Supabase rotacionado não persiste, fazendo o próximo request
// ser deslogado e redirecionar pra /login.
//
// Esta route handler:
//   - lê cookies via NextRequest (cookie set pelo Supabase SSR persiste
//     na response automaticamente)
//   - valida sessão (401 se ausente)
//   - aceita o punch via Supabase com RLS aplicada
//   - retorna JSON puro — client atualiza estado local sem router.refresh
//
// Sem revalidatePath aqui — a UI do colaborador faz optimistic update,
// e a view do GM (/pessoas/ponto) é re-fetched no próximo SSR natural.

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PunchTipo, TimeClockPunch } from "@/types/pessoas";

export const runtime = "nodejs";

type Body = {
  employeeId?: string;
  tipo?: PunchTipo;
  latitude?: number | null;
  longitude?: number | null;
  deviceInfo?: string | null;
};

const VALID_TIPOS: ReadonlyArray<PunchTipo> = [
  "entrada",
  "saida",
  "intervalo_inicio",
  "intervalo_fim",
];

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  if (!body.employeeId) {
    return NextResponse.json(
      { ok: false, error: "employeeId obrigatório" },
      { status: 400 },
    );
  }
  if (!body.tipo || !VALID_TIPOS.includes(body.tipo)) {
    return NextResponse.json(
      { ok: false, error: "tipo inválido" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase indisponível" },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { ok: false, error: "Não autenticado" },
      { status: 401 },
    );
  }

  const lat = typeof body.latitude === "number" ? body.latitude : null;
  const lng = typeof body.longitude === "number" ? body.longitude : null;
  const deviceInfo =
    typeof body.deviceInfo === "string" && body.deviceInfo.length > 0
      ? body.deviceInfo
      : null;

  const { data, error } = await supabase
    .from("time_clock_punches")
    .insert({
      employee_id: body.employeeId,
      tipo: body.tipo,
      latitude: lat,
      longitude: lng,
      device_info: deviceInfo,
      timestamp_punch: new Date().toISOString(),
    } as never)
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Falha ao registrar ponto" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: data as TimeClockPunch });
}
