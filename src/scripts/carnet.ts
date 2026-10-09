/**
 * Carnet de Héroe 1080x1350 (formato historia/feed).
 *
 * Fase 1: se dibuja en el navegador con <canvas>.
 * Fase 2: el mismo diseño se genera en el servidor (Satori) para adjuntarlo
 * al email de agradecimiento.
 */
import { characters, logo } from '../config/characters';
import t from '../i18n/es';

export interface CarnetData {
  name: string;
  piece: string;
  pieceIcon: string;
  amount: string;
  monthly: boolean;
  date: string;
  id: string;
}

const W = 1080;
const H = 1350;
const INK = '#1D2B4F';
const FONT = '"Baloo 2", system-ui, sans-serif';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#F4FBFF';
  ctx.beginPath();
  ctx.arc(x, y, 40 * s, 0, Math.PI * 2);
  ctx.arc(x + 50 * s, y - 20 * s, 52 * s, 0, Math.PI * 2);
  ctx.arc(x + 105 * s, y, 40 * s, 0, Math.PI * 2);
  ctx.rect(x, y - 2 * s, 105 * s, 42 * s);
  ctx.fill('nonzero');
}

/** Escribe centrado reduciendo el tamaño hasta que quepa. */
function fitText(ctx: CanvasRenderingContext2D, text: string, y: number, maxW: number, size: number, weight = 800) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${FONT}`;
    s -= 2;
  } while (ctx.measureText(text).width > maxW && s > 20);
  ctx.fillText(text, W / 2, y);
}

export async function drawCarnet(canvas: HTMLCanvasElement, data: CarnetData) {
  const ctx = canvas.getContext('2d')!;
  try {
    await Promise.all([document.fonts.load(`800 80px ${FONT}`), document.fonts.load(`500 40px ${FONT}`)]);
  } catch {
    /* si la fuente no carga se usa la del sistema */
  }

  // Cielo
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#6EC1F0');
  sky.addColorStop(1, '#CDEEFC');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  cloud(ctx, 60, 330, 1.1);
  cloud(ctx, 800, 420, 0.9);
  cloud(ctx, 120, 760, 0.7);
  [
    [140, 260, 22, '#FFD400'],
    [940, 270, 18, '#FFD400'],
    [960, 700, 26, '#E53935'],
    [100, 620, 16, '#4CAF50'],
    [880, 560, 14, '#F06292'],
  ].forEach(([x, y, r, c]) => star(ctx, x as number, y as number, r as number, c as string));

  // Banda superior
  ctx.save();
  ctx.translate(W / 2, 150);
  ctx.rotate(-0.025);
  roundRect(ctx, -440, -80, 880, 160, 40);
  ctx.fillStyle = '#C62828';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 100px ${FONT}`;
  ctx.fillText('HÉROE OFICIAL', 0, 8);
  ctx.restore();

  // Personaje
  const [hero, brand] = await Promise.all([loadImage(characters.calvito.src), loadImage(logo.src)]);
  const S = 480;
  const X = (W - S) / 2;
  const Y = 270;
  ctx.save();
  ctx.translate(W / 2, Y + S / 2);
  ctx.rotate(-0.035);
  ctx.translate(-W / 2, -(Y + S / 2));
  roundRect(ctx, X, Y + 14, S, S, 56);
  ctx.fillStyle = INK;
  ctx.fill();
  roundRect(ctx, X, Y, S, S, 56);
  ctx.save();
  ctx.clip();
  ctx.drawImage(hero, X, Y, S, S);
  ctx.restore();
  roundRect(ctx, X, Y, S, S, 56);
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();

  // Tarjeta de datos
  roundRect(ctx, 80, 790, W - 160, 380, 44);
  ctx.fillStyle = INK;
  ctx.save();
  ctx.translate(0, 14);
  ctx.fill();
  ctx.restore();
  roundRect(ctx, 80, 790, W - 160, 380, 44);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  fitText(ctx, data.name, 895, W - 260, 92);
  ctx.fillStyle = '#46557A';
  ctx.font = `500 40px ${FONT}`;
  ctx.fillText('puso en la SUPERCASA', W / 2, 955);
  ctx.fillStyle = '#C62828';
  fitText(ctx, `${data.pieceIcon} ${data.piece}`, 1028, W - 260, 64);
  ctx.fillStyle = INK;
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText(`${data.amount}${data.monthly ? ' / mes' : ''} · ${data.date}`, W / 2, 1090);
  ctx.fillStyle = '#46557A';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(`ID ${data.id}`, W / 2, 1136);

  // Pie con el logo de la fundación
  const LW = 240;
  const LH = (LW * logo.height) / logo.width;
  roundRect(ctx, (W - LW) / 2 - 26, 1190, LW + 52, LH + 22, 36);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.drawImage(brand, (W - LW) / 2, 1201, LW, LH);
  ctx.fillStyle = INK;
  fitText(ctx, t.thanks.officialLine, 1308, W - 120, 32, 700);
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText('#PonteLaCapa  ·  #SuperCasa', W / 2, 1338);
}

export function carnetBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}
