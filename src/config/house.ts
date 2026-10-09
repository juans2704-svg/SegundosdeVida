/**
 * Fases ilustradas de la SUPERCASA (una imagen cada 5 %), según docs/brief-casa-fases.md.
 *
 * Para agregar una fase nueva:
 * 1. Guardar `supercasa-XXX-1200.webp` y `supercasa-XXX-720.webp` en public/img/casa/
 *    (alineadas con las demás y del mismo tamaño).
 * 2. Agregar el porcentaje a `available`.
 */
export const houseFrames = {
  /** PENDIENTE: faltan 0 % a 45 %. */
  available: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
  width: 1200,
  height: 893,
  widths: [720, 1200],
};

const pad = (n: number) => String(n).padStart(3, '0');

export const frameSrc = (pct: number, width = 1200) => `/img/casa/supercasa-${pad(pct)}-${width}.webp`;

export const frameSrcset = (pct: number) => houseFrames.widths.map((w) => `${frameSrc(pct, w)} ${w}w`).join(', ');

/** Fase que corresponde al recaudo (múltiplo de 5 hacia abajo). */
export const stepFor = (pct: number) => Math.min(100, Math.floor(pct / 5) * 5);

/**
 * Imagen a mostrar: la fase exacta si existe; si no, la disponible más cercana.
 * `missing` indica que se está mostrando una fase distinta a la que corresponde.
 */
export function frameFor(pct: number): { frame: number; step: number; missing: boolean } {
  const step = stepFor(pct);
  const list = houseFrames.available;
  const below = list.filter((f) => f <= step);
  const frame = below.length ? below[below.length - 1] : list[0];
  return { frame, step, missing: frame !== step };
}

export const hasFrame = (pct: number) => houseFrames.available.includes(pct);
