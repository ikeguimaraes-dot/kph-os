import { notFound } from "next/navigation"

const TITLES: Record<string, string> = {
  receita:               "Receita",
  folha:                 "Folha",
  cmv:                   "CMV",
  ocupacao:              "Ocupação",
  utilidades:            "Utilidades",
  operacao:              "Operação",
  manutencao:            "Manutenção",
  administrativo:        "Administrativo",
  marketing:             "Marketing",
  "taxas-cartao":        "Taxas de Cartão",
  impostos:              "Impostos",
  "despesas-financeiras":"Despesas Financeiras",
  budget:                "Budget",
}

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return Object.keys(TITLES).map((slug) => ({ slug }))
}

export default async function DreSectionPage({ params }: Props) {
  const { slug } = await params
  const title = TITLES[slug]
  if (!title) notFound()

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
        DRE — {title}
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-3)" }}>Módulo em construção.</p>
    </div>
  )
}
