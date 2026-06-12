// Vercel Cron endpoint — Learning Machine weekly report.
// Schedule: 0 11 * * 5 (every Friday at 11:00 UTC = 08:00 BRT)
// Configured in vercel.json.

import { NextResponse } from "next/server";
import { generateLearningMachineReport } from "@/lib/inteligencia/learning-machine";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Anthropic call can take up to ~10s

export async function GET(request: Request) {
  // Vercel cron requests include this header — reject other callers in prod
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET ?? ""}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await generateLearningMachineReport();
    if (!report) {
      return NextResponse.json(
        { error: "Report generation failed — check server logs" },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      week: report.week_number,
      year: report.year,
      total_runs: report.total_runs,
      active_agents: report.active_agents,
      score: report.insights?.score_operacional ?? null,
    });
  } catch (e) {
    console.error("[cron/learning-machine] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
