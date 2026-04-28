// EscalaScreen — visualização da escala da semana corrente do colaborador.
// Read-only. Pega shifts da tabela `shifts` filtrando por employee_id +
// data dentro da semana atual (segunda → domingo), e renderiza um card
// por dia mostrando turno (almoço/jantar/integral/folga) + horários.

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/auth';
import { COLORS } from '../lib/types';

interface Shift {
  id: string;
  data: string;        // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fim: string;
  tipo: string;        // normal | extra | folga | feriado
  observacao?: string | null;
}

type Turno = 'almoco' | 'jantar' | 'integral' | 'folga' | 'feriado' | 'plantao';

const TURNO_LABEL: Record<Turno, string> = {
  almoco: 'Almoço',
  jantar: 'Jantar',
  integral: 'Integral',
  folga: 'Folga',
  feriado: 'Feriado',
  plantao: 'Plantão',
};

const TURNO_COLOR: Record<Turno, string> = {
  almoco: '#F59E0B',
  jantar: '#7C3AED',
  integral: '#0EA5E9',
  folga: '#94A3B8',
  feriado: '#EC4899',
  plantao: '#10B981',
};

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Retorna a segunda-feira da semana de `d` (00:00 hora local). */
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  // 0=Dom, 1=Seg, ..., 6=Sáb. Queremos voltar até segunda.
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Deriva turno a partir de tipo + horários. */
function deriveTurno(s: Shift): Turno {
  if (s.tipo === 'folga') return 'folga';
  if (s.tipo === 'feriado') return 'feriado';
  const inicio = parseInt(s.hora_inicio.slice(0, 2), 10);
  const fim = parseInt(s.hora_fim.slice(0, 2), 10);
  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return 'plantao';
  // Integral: começa cedo e fecha tarde
  if (inicio <= 13 && fim >= 18) return 'integral';
  // Almoço: começa cedo (até 13h) e fecha cedo
  if (inicio <= 13 && fim < 18) return 'almoco';
  // Jantar: começa tarde (>= 14h)
  if (inicio >= 14) return 'jantar';
  return 'plantao';
}

function formatHora(hms: string): string {
  return hms?.slice(0, 5) ?? '';
}

export default function EscalaScreen({ navigation }: any) {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) {
        Alert.alert('Sessão expirada', 'Faça login novamente.', [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
        ]);
        return;
      }
      setEmployeeId(session.employee.id);
    })();
  }, []);

  const fetchShifts = useCallback(async () => {
    if (!employeeId) return;
    const start = isoDate(weekStart);
    const end = isoDate(addDays(weekStart, 6));
    const { data, error } = await supabase
      .from('shifts')
      .select('id, data, hora_inicio, hora_fim, tipo, observacao')
      .eq('employee_id', employeeId)
      .gte('data', start)
      .lte('data', end)
      .order('data');
    if (error) {
      console.error('[ESCALA] error:', error);
      Alert.alert('Erro', 'Não foi possível carregar a escala.');
    }
    setShifts((data ?? []) as Shift[]);
    setLoading(false);
  }, [employeeId, weekStart]);

  useEffect(() => {
    if (employeeId) fetchShifts();
  }, [employeeId, weekStart]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShifts();
    setRefreshing(false);
  }, [fetchShifts]);

  function goPrevWeek() {
    setWeekStart((prev) => addDays(prev, -7));
  }
  function goNextWeek() {
    setWeekStart((prev) => addDays(prev, 7));
  }
  function goCurrentWeek() {
    setWeekStart(startOfWeek(new Date()));
  }

  const dias = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const isCurrentWeek =
    isoDate(weekStart) === isoDate(startOfWeek(new Date()));

  // Index shifts by data (YYYY-MM-DD)
  const byData = new Map<string, Shift>();
  for (const s of shifts) byData.set(s.data, s);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.weekNav}>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekLabel}>
            {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            {' → '}
            {addDays(weekStart, 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </Text>
          {!isCurrentWeek && (
            <Text style={styles.weekSubtle} onPress={goCurrentWeek}>
              Voltar pra semana atual
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <NavBtn icon="chevron-back" onPress={goPrevWeek} />
          <NavBtn icon="chevron-forward" onPress={goNextWeek} />
        </View>
      </View>

      {dias.map((d, idx) => {
        const iso = isoDate(d);
        const shift = byData.get(iso);
        const isToday = iso === isoDate(new Date());
        const turno: Turno | null = shift ? deriveTurno(shift) : null;
        const color = turno ? TURNO_COLOR[turno] : COLORS.BORDER;

        return (
          <View
            key={iso}
            style={[
              styles.dayCard,
              isToday && { borderColor: COLORS.PRIMARY, borderWidth: 2 },
            ]}
          >
            <View style={styles.dayHeader}>
              <View
                style={[
                  styles.dayBadge,
                  { backgroundColor: color + '22', borderColor: color },
                ]}
              >
                <Text style={[styles.dayName, { color }]}>{DIAS_SEMANA[idx]}</Text>
                <Text style={[styles.dayNum, { color }]}>{d.getDate()}</Text>
              </View>
              {isToday && (
                <Text style={styles.todayTag}>HOJE</Text>
              )}
            </View>
            {shift ? (
              <View style={{ marginTop: 8 }}>
                <View style={styles.row}>
                  <Ionicons name="briefcase-outline" size={14} color={color} />
                  <Text style={[styles.turno, { color }]}>
                    {turno ? TURNO_LABEL[turno] : '—'}
                  </Text>
                </View>
                {turno !== 'folga' && turno !== 'feriado' && (
                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={14} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.horario}>
                      {formatHora(shift.hora_inicio)} – {formatHora(shift.hora_fim)}
                    </Text>
                  </View>
                )}
                {shift.observacao && (
                  <Text style={styles.obs}>{shift.observacao}</Text>
                )}
              </View>
            ) : (
              <Text style={styles.empty}>Sem escala definida</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function NavBtn({ icon, onPress }: { icon: any; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={{
        padding: 10,
        backgroundColor: COLORS.CARD,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
      }}
    >
      <Ionicons name={icon} size={18} color={COLORS.TEXT} />
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  weekSubtle: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginTop: 2,
    fontWeight: '600',
  },
  dayCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
  },
  todayTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  turno: {
    fontSize: 15,
    fontWeight: '700',
  },
  horario: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    fontVariantNumeric: 'tabular-nums',
  },
  obs: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
  },
});
