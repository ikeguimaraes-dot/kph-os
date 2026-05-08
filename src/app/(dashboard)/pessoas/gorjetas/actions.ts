'use server'

import { createServiceClient } from '@/lib/supabase/server'

type PeriodoRow = {
  unit_id: string
  data: string
  receita_bruta: number
  total_pontos: number
  fonte: string
}

export async function upsertGorjetaPeriodos(rows: PeriodoRow[]): Promise<{ error: string | null }> {
  const sb = createServiceClient()
  if (!sb) return { error: 'Service client indisponível' }

  const { error } = await (sb as any)
    .from('gorjeta_periodos')
    .upsert(rows, { onConflict: 'unit_id,data' })

  return { error: error?.message ?? null }
}
