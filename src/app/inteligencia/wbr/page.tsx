import { requireUser } from "@kph/auth/server";
import { currentWeekIso, loadWbr } from "@/lib/inteligencia/wbr";
import { generateWbrInsight } from "./actions";
import { WbrClient } from "./wbr-client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function WbrPage({ searchParams }: Props) {
  await requireUser();
  const sp = await searchParams;
  const ref = sp?.ref ?? currentWeekIso();

  const data = await loadWbr(ref);

  // Gerar insight com timeout de 5s — não deve travar a página
  let insight = null;
  if (data) {
    try {
      insight = await Promise.race([
        generateWbrInsight(data),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
    } catch {
      insight = null;
    }
  }

  return <WbrClient refDate={ref} payload={data} insight={insight} />;
}
