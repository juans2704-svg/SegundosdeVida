import { campaign, stages, type Stage } from '../config/campaign';

export interface Progress {
  raised: number;
  goal: number;
  heroes: number;
}

/** Fase 1: datos del archivo de configuración. Fase 2: consulta a Supabase. */
export function getInitialProgress(): Progress {
  return { raised: campaign.raised, goal: campaign.goal, heroes: campaign.heroes };
}

export const percentOf = (p: Pick<Progress, 'raised' | 'goal'>) =>
  Math.min(100, (p.raised / p.goal) * 100);

/** Ancho de la barra: nunca menos del mínimo visual. */
export const visualPercent = (pct: number) => Math.max(campaign.minVisualPct, pct);

/** Nivel visual de la casa (0 a 5): última etapa cuyo umbral ya se alcanzó. */
export function houseLevel(pct: number): number {
  let level = 0;
  stages.forEach((s, i) => {
    if (pct >= s.threshold) level = i;
  });
  return level;
}

/** Etapa en la que se está trabajando: la primera que aún no se alcanza. */
export function currentStage(pct: number): Stage {
  return stages.find((s) => pct < s.threshold) ?? stages[stages.length - 1];
}

/** Días que faltan para la fecha límite (0 si ya pasó). */
export function daysLeft(now = new Date()): number {
  const ms = new Date(campaign.deadline).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** La próxima fase de 5 % de la casa y cuánto falta para llegar a ella. */
export function nextMilestone(p: Pick<Progress, 'raised' | 'goal'>): { pct: number; missing: number } | null {
  const pct = Math.floor(percentOf(p) / 5) * 5 + 5;
  if (pct > 100) return null;
  return { pct, missing: Math.max(0, Math.ceil((p.goal * pct) / 100 - p.raised)) };
}

/** Si ya se puede mostrar el monto recaudado (evita lanzar mostrando $0). */
export const showRaised = (raised: number) => raised >= campaign.showRaisedFrom;
