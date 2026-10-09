/**
 * Super Calvitos PROVISIONALES dibujados en SVG.
 *
 * Una sola fuente para la página (Astro) y para el Carnet de Héroe (canvas).
 * Cuando lleguen los artes oficiales de la fundación, se reemplaza
 * `SuperCalvito.astro` por imágenes WebP/Lottie y `carnet.ts` por el PNG oficial.
 */

export type Accessory = 'none' | 'helmet' | 'roller' | 'party';

export interface CalvitoOptions {
  /** 'calvito' o 'calvita' */
  who?: 'calvito' | 'calvita';
  mask?: string;
  cape?: string;
  suit?: string;
  emblem?: 'star' | 'heart';
  accessory?: Accessory;
  /** Brazo levantado saludando */
  wave?: boolean;
}

const SKIN = '#F7C9A6';
const SKIN_SHADE = '#EDB28C';
const INK = '#1D2B4F';
const YELLOW = '#FFD400';

function star(cx: number, cy: number, r: number, fill: string, stroke = '') {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  const s = stroke ? ` stroke="${stroke}" stroke-width="2" stroke-linejoin="round"` : '';
  return `<polygon points="${pts.join(' ')}" fill="${fill}"${s}/>`;
}

function heart(cx: number, cy: number, s: number, fill: string) {
  return `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 6 C-10 -2 -8 -12 0 -6 C8 -12 10 -2 0 6 Z" fill="${fill}" stroke="${INK}" stroke-width="${(1.2 / s).toFixed(2)}"/>`;
}

export function calvitoSVG(opts: CalvitoOptions = {}): string {
  const who = opts.who ?? 'calvito';
  const girl = who === 'calvita';
  const mask = opts.mask ?? (girl ? '#E53935' : '#4CAF50');
  const cape = opts.cape ?? (girl ? '#2F80ED' : '#E53935');
  const suit = opts.suit ?? (girl ? '#F06292' : '#2F80ED');
  const emblem = opts.emblem ?? (girl ? 'heart' : 'star');
  const acc = opts.accessory ?? 'none';
  const wave = opts.wave ?? acc === 'none';

  const parts: string[] = [];

  // Capa (detrás de todo)
  parts.push(
    `<path class="cv-cape" d="M70 128 C46 160 40 200 34 232 Q66 222 100 232 Q134 222 166 232 C160 200 154 160 130 128 Z" fill="${cape}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    star(100, 206, 11, YELLOW, INK),
  );

  // Piernas y botas
  parts.push(
    `<rect x="78" y="182" width="18" height="34" rx="8" fill="${suit}" stroke="${INK}" stroke-width="3"/>`,
    `<rect x="104" y="182" width="18" height="34" rx="8" fill="${suit}" stroke="${INK}" stroke-width="3"/>`,
    `<ellipse cx="86" cy="218" rx="13" ry="8" fill="${cape}" stroke="${INK}" stroke-width="3"/>`,
    `<ellipse cx="114" cy="218" rx="13" ry="8" fill="${cape}" stroke="${INK}" stroke-width="3"/>`,
  );

  // Brazo izquierdo (abajo)
  parts.push(
    `<path d="M74 140 Q56 160 60 182" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>`,
    `<path d="M74 140 Q56 160 60 182" fill="none" stroke="${suit}" stroke-width="9" stroke-linecap="round"/>`,
    `<circle cx="60" cy="184" r="8" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`,
  );

  // Cuerpo
  parts.push(
    `<rect x="68" y="124" width="64" height="66" rx="26" fill="${suit}" stroke="${INK}" stroke-width="3"/>`,
    `<rect x="70" y="174" width="60" height="8" fill="${YELLOW}" stroke="${INK}" stroke-width="2"/>`,
  );
  parts.push(
    emblem === 'star'
      ? `<circle cx="100" cy="152" r="15" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` + star(100, 153, 12, YELLOW, INK)
      : `<circle cx="100" cy="152" r="15" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` + heart(100, 153, 1.15, '#E53935'),
  );

  // Brazo derecho: saludando, o sosteniendo accesorio
  const armUp = wave || acc === 'roller' || acc === 'party';
  const armPath = armUp ? 'M126 140 Q150 124 152 98' : 'M126 140 Q144 160 140 182';
  const hand = armUp ? [152, 94] : [140, 184];
  parts.push(
    `<path d="${armPath}" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>`,
    `<path d="${armPath}" fill="none" stroke="${suit}" stroke-width="9" stroke-linecap="round"/>`,
  );
  if (acc === 'roller') {
    parts.push(
      `<path d="M152 94 L160 66" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
      `<path d="M160 66 L176 62" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
      `<rect x="164" y="40" width="30" height="20" rx="6" transform="rotate(-14 179 50)" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>`,
      `<path d="M168 58 q4 10 0 16" stroke="${YELLOW}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
    );
  }
  parts.push(`<circle cx="${hand[0]}" cy="${hand[1]}" r="8.5" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`);

  // Cabeza calva
  parts.push(
    `<circle cx="52" cy="82" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`,
    `<circle cx="148" cy="82" r="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`,
    `<circle cx="100" cy="78" r="50" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`,
    `<path d="M62 98 Q100 136 138 98 Q120 124 100 125 Q80 124 62 98 Z" fill="${SKIN_SHADE}" opacity=".45"/>`,
    `<ellipse cx="80" cy="44" rx="16" ry="8" fill="#fff" opacity=".55" transform="rotate(-24 80 44)"/>`,
  );

  // Antifaz con colitas al lado
  parts.push(
    `<path d="M54 72 Q40 80 34 98 L46 94 Q48 82 56 78 Z" fill="${mask}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    `<path d="M146 72 Q160 80 166 98 L154 94 Q152 82 144 78 Z" fill="${mask}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    `<path d="M52 70 Q52 58 76 60 Q92 61 100 68 Q108 61 124 60 Q148 58 148 70 Q148 92 124 92 Q108 92 100 84 Q92 92 76 92 Q52 92 52 70 Z" fill="${mask}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    `<ellipse cx="78" cy="75" rx="12" ry="11" fill="#fff"/>`,
    `<ellipse cx="122" cy="75" rx="12" ry="11" fill="#fff"/>`,
    `<circle cx="80" cy="77" r="6.5" fill="${INK}"/>`,
    `<circle cx="120" cy="77" r="6.5" fill="${INK}"/>`,
    `<circle cx="82.5" cy="74" r="2.4" fill="#fff"/>`,
    `<circle cx="122.5" cy="74" r="2.4" fill="#fff"/>`,
  );
  if (girl) {
    parts.push(
      `<path d="M66 66 l-6 -6 M70 63 l-3 -8 M130 63 l3 -8 M134 66 l6 -6" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
    );
  }

  // Mejillas y sonrisa
  parts.push(
    `<ellipse cx="68" cy="100" rx="8" ry="5" fill="#F48FB1" opacity=".75"/>`,
    `<ellipse cx="132" cy="100" rx="8" ry="5" fill="#F48FB1" opacity=".75"/>`,
  );
  parts.push(
    acc === 'party'
      ? `<path d="M84 100 Q100 122 116 100 Z" fill="#B71C1C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M92 110 Q100 116 108 110" fill="#F48FB1"/>`
      : `<path d="M86 102 Q100 116 114 102" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  );

  // Accesorios de cabeza
  if (girl && acc !== 'helmet' && acc !== 'party') {
    parts.push(heart(128, 34, 1.4, '#F06292'));
  }
  if (acc === 'helmet') {
    parts.push(
      `<path d="M54 56 Q54 18 100 18 Q146 18 146 56 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
      `<rect x="92" y="18" width="16" height="38" rx="6" fill="#FFB300" stroke="${INK}" stroke-width="2.5"/>`,
      `<rect x="42" y="52" width="116" height="11" rx="5.5" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>`,
    );
  }
  if (acc === 'party') {
    parts.push(
      `<path d="M78 34 L98 -14 L120 32 Z" fill="#8E5CC9" stroke="${INK}" stroke-width="3" stroke-linejoin="round" transform="rotate(12 100 30)"/>`,
      `<path d="M84 22 L114 26 M90 6 L110 10" stroke="${YELLOW}" stroke-width="4" transform="rotate(12 100 30)"/>`,
      `<circle cx="106" cy="-12" r="7" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5" transform="rotate(12 100 30)"/>`,
      `<g class="cv-confetti">` +
        star(24, 40, 7, YELLOW) +
        `<rect x="170" y="120" width="8" height="8" fill="#4CAF50" transform="rotate(20 174 124)"/>` +
        `<rect x="20" y="130" width="8" height="8" fill="#E53935" transform="rotate(-20 24 134)"/>` +
        `<circle cx="178" cy="28" r="4.5" fill="#F06292"/>` +
        star(184, 160, 6, '#2F80ED') +
        `</g>`,
    );
  }

  return parts.join('');
}

/** SVG completo listo para insertar o convertir en imagen. */
export function calvitoDocument(opts: CalvitoOptions = {}, title = 'Super Calvito'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 200 260" role="img"><title>${title}</title>${calvitoSVG(opts)}</svg>`;
}
