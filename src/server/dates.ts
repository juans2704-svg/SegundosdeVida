/** Fechas en hora de Bogotá, como texto YYYY-MM-DD. */
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });

export const todayBogota = (d = new Date()) => fmt.format(d);

/** YYYYMM del día dado. */
export const period = (day: string) => day.slice(0, 7).replace('-', '');

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Mismo día del mes siguiente a `day`, usando `anchorDay` (1–28) para que los
 * cobros caigan siempre el mismo día aunque un mes sea más corto.
 */
export function nextMonthOn(day: string, anchorDay: number): string {
  const [y, m] = day.split('-').map(Number);
  const year = m === 12 ? y + 1 : y;
  const month = m === 12 ? 1 : m + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(28, Math.max(1, anchorDay))).padStart(2, '0')}`;
}
