import { formatCLP, formatPercent } from './money';
import { formatMonthYear } from './date';
import { variableCategoryLabel } from './categories';
import type { Goal } from '../types/models';
import { progressPct, requiredMonthly } from '../hooks/useGoals';

export interface Insight {
  title: string;
  body: string;
  tone: 'neutral' | 'good' | 'warn';
}

export interface InsightInput {
  month: string;
  income: number;
  fixed: number;
  variable: number;
  savings: number;
  capex: number;
  variableByCategory: Map<string, number>;
  variableCapByCategory: Map<string, number>;
  netWorth: number;
  liquid: number;
  prev: { income: number; fixed: number; variable: number; savings: number; capex: number } | null;
  goals: Goal[];
  plannedNext: { month: string; label: string; amount: number; kind: 'ingreso' | 'gasto' }[];
}

/**
 * Observaciones derivadas de los números del mes. Cada una dice un hecho y su
 * consecuencia; ninguna inventa datos que no estén cargados.
 */
export function buildInsights(d: InsightInput): Insight[] {
  const out: Insight[] = [];
  const spend = d.fixed + d.variable;
  const fcl = d.income - spend - d.savings - d.capex;

  // 1. Tasa de ahorro
  if (d.income > 0) {
    const rate = ((d.savings + Math.max(fcl, 0)) / d.income) * 100;
    out.push({
      title: `Guardaste ${formatPercent(rate, 1)} de lo que entró`,
      body: `De ${formatCLP(d.income)} que entraron, ${formatCLP(d.savings)} fueron a ahorro comprometido y ${formatCLP(Math.max(fcl, 0))} quedaron sin asignar.`,
      tone: rate >= 20 ? 'good' : rate > 0 ? 'neutral' : 'warn',
    });
  }

  // 2. Flujo negativo
  if (fcl < 0) {
    out.push({
      title: `Gastaste ${formatCLP(-fcl)} más de lo que entró`,
      body: 'El mes cierra en rojo: o entró menos de lo previsto, o los variables se pasaron. Revisa el detalle por categoría antes de cerrar.',
      tone: 'warn',
    });
  }

  // 3. Categoría variable más pesada
  const cats = [...d.variableByCategory.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) {
    const [topKey, topValue] = cats[0];
    const share = d.variable > 0 ? (topValue / d.variable) * 100 : 0;
    out.push({
      title: `${variableCategoryLabel(topKey)} se llevó ${formatPercent(share, 0)} de tus variables`,
      body: `${formatCLP(topValue)} de ${formatCLP(d.variable)} en gastos variables. Es la categoría donde un ajuste rinde más.`,
      tone: 'neutral',
    });
  }

  // 4. Topes pasados
  const over = [...d.variableCapByCategory.entries()]
    .map(([key, cap]) => ({ key, cap, spent: d.variableByCategory.get(key) ?? 0 }))
    .filter((c) => c.cap > 0 && c.spent > c.cap);
  if (over.length > 0) {
    const worst = over.sort((a, b) => b.spent - b.cap - (a.spent - a.cap))[0];
    out.push({
      title: `${over.length} ${over.length === 1 ? 'categoría se pasó' : 'categorías se pasaron'} del tope`,
      body: `La que más se salió es ${variableCategoryLabel(worst.key)}: ${formatCLP(worst.spent - worst.cap)} sobre un tope de ${formatCLP(worst.cap)}.`,
      tone: 'warn',
    });
  }

  // 5. Comparación con el mes anterior
  if (d.prev) {
    const prevFcl = d.prev.income - d.prev.fixed - d.prev.variable - d.prev.savings - d.prev.capex;
    const delta = fcl - prevFcl;
    out.push({
      title: delta >= 0 ? `Cerraste ${formatCLP(delta)} mejor que el mes pasado` : `Cerraste ${formatCLP(-delta)} peor que el mes pasado`,
      body: `Flujo libre de ${formatCLP(fcl)} contra ${formatCLP(prevFcl)} del mes anterior.`,
      tone: delta >= 0 ? 'good' : 'warn',
    });
  }

  // 6. Colchón
  if (spend > 0 && d.liquid > 0) {
    const months = d.liquid / spend;
    out.push({
      title: `Tu líquido cubre ${months.toFixed(1)} meses de gastos`,
      body: `${formatCLP(d.liquid)} disponibles contra ${formatCLP(spend)} de gasto mensual. Bajo 3 meses conviene priorizar el fondo de emergencia.`,
      tone: months >= 3 ? 'good' : 'warn',
    });
  }

  // 7. Metas
  const openGoals = d.goals.filter((g) => !g.completed_at);
  if (openGoals.length > 0) {
    const required = openGoals.reduce((a, g) => a + requiredMonthly(g), 0);
    const behind = openGoals.filter((g) => g.monthly_contribution < requiredMonthly(g));
    out.push({
      title:
        required <= fcl + d.savings
          ? `Tus ${openGoals.length} metas caben en tu flujo`
          : `Tus metas piden ${formatCLP(required)} al mes`,
      body:
        required <= fcl + d.savings
          ? `Requieren ${formatCLP(required)} mensuales y tienes ${formatCLP(fcl + d.savings)} entre ahorro y sobrante.`
          : `Tienes ${formatCLP(fcl + d.savings)} entre ahorro y sobrante: faltan ${formatCLP(required - fcl - d.savings)}. ${behind.length} ${behind.length === 1 ? 'meta va' : 'metas van'} bajo el aporte necesario.`,
      tone: required <= fcl + d.savings ? 'good' : 'warn',
    });

    const closest = openGoals
      .filter((g) => g.target_date)
      .sort((a, b) => (a.target_date! < b.target_date! ? -1 : 1))[0];
    if (closest) {
      out.push({
        title: `${closest.name} va ${formatPercent(progressPct(closest), 0)} cumplida`,
        body: `${formatCLP(closest.current_amount)} de ${formatCLP(closest.target_amount)}. Pide ${formatCLP(requiredMonthly(closest))} al mes para llegar en ${formatMonthYear(closest.target_date!)}.`,
        tone: 'neutral',
      });
    }
  }

  // 8. Compromisos programados
  if (d.plannedNext.length > 0) {
    const gastos = d.plannedNext.filter((p) => p.kind === 'gasto');
    const total = gastos.reduce((a, p) => a + p.amount, 0);
    if (total > 0) {
      out.push({
        title: `Tienes ${formatCLP(total)} comprometidos hacia adelante`,
        body: `${gastos.length} ${gastos.length === 1 ? 'gasto programado' : 'gastos programados'}, el próximo es ${gastos[0].label} en ${formatMonthYear(gastos[0].month)}.`,
        tone: 'neutral',
      });
    }
  }

  return out;
}
