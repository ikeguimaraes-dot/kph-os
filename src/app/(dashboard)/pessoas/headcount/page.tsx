import { requireRole } from "@/lib/auth/server";
import {
  getHeadcountStats,
  getDistribuicaoMarcas,
  getDistribuicaoFuncoes,
  getDistribuicaoDepartamentos,
  getMovimentacoesRecentes,
  getVagasAbertas,
  getHeadcountBrands,
  type Period,
} from "@/lib/pessoas/headcount-actions";
import { HeadcountClient } from "./headcount-client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ period?: string; brandId?: string }>;
};

export default async function HeadcountPage({ searchParams }: Props) {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const sp = await searchParams;
  const period: Period =
    sp.period === "trimestre" || sp.period === "ano" ? sp.period : "mes";
  const brandId = sp.brandId ?? "";

  const filters = { period, brandId: brandId || undefined };

  const [stats, marcas, funcoes, departamentos, movimentacoes, vagas, brands] =
    await Promise.all([
      getHeadcountStats(filters),
      getDistribuicaoMarcas(filters),
      getDistribuicaoFuncoes(filters),
      getDistribuicaoDepartamentos(filters),
      getMovimentacoesRecentes(filters),
      getVagasAbertas({ brandId: brandId || undefined }),
      getHeadcountBrands(),
    ]);

  return (
    <HeadcountClient
      period={period}
      brandId={brandId}
      brands={brands}
      stats={stats}
      marcas={marcas}
      funcoes={funcoes}
      departamentos={departamentos}
      movimentacoes={movimentacoes}
      vagas={vagas}
    />
  );
}
