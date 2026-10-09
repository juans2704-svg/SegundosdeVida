/**
 * Fases ilustradas de la SUPERCASA (una imagen cada 5 %), según docs/brief-casa-fases.md.
 *
 * Para reemplazar una fase: guardar `supercasa-XXX-1200.webp` y `supercasa-XXX-720.webp`
 * en public/img/casa/, alineadas con las demás y del mismo tamaño (1200 × 893 y 720 × 536).
 */
export const houseFrames = {
  available: Array.from({ length: 21 }, (_, i) => i * 5),
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
