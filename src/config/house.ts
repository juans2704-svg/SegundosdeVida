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

/** Qué aparece en la casa en cada fase (para "la próxima pieza de la casa"). */
export const frameLabels: Record<number, string> = {
  0: '🧱 La obra gris',
  5: '🧱 Llegan los materiales',
  10: '🏗️ La placa de la cubierta',
  15: '🪜 La baranda de la azotea',
  20: '🪴 Las jardineras de la azotea',
  25: '🌱 Los primeros brotes',
  30: '🌳 Los arbustos de la azotea',
  35: '🌿 El jardín de la azotea',
  40: '🧱 El ladrillo de los primeros pisos',
  45: '🎨 Toda la fachada',
  50: '🪟 Las ventanas',
  55: '🏠 El gran ventanal',
  60: '✨ Los acabados de la fachada',
  65: '💡 Las luces de los pisos altos',
  70: '💡 Las luces de toda la casa',
  75: '🦸 El letrero LA SUPER CASA',
  80: '🛁 La cocina, los baños y los cuartos',
  85: '🌳 Los árboles y el jardín',
  90: '🚪 La reja de la entrada',
  95: '🌻 ¡Hogar listo!',
  100: '🎉 La fiesta de inauguración',
};
