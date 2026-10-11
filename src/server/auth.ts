/**
 * Acceso al panel (/admin) con usuario y contraseña (HTTP Basic sobre HTTPS).
 * - admin  / ADMIN_PASSWORD  → ve todo y registra aportes manuales.
 * - editor / EDITOR_PASSWORD → solo consulta.
 * Si no hay contraseñas configuradas, el panel no existe (404).
 */
import { timingSafeEqual } from 'node:crypto';
import { env } from './env';

export type Role = 'admin' | 'editor';

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const panelEnabled = () => Boolean(env('ADMIN_PASSWORD'));

export function roleFor(request: Request): Role | null {
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return null;
  let decoded = '';
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    return null;
  }
  const i = decoded.indexOf(':');
  const user = decoded.slice(0, i);
  const pass = decoded.slice(i + 1);
  const adminPass = env('ADMIN_PASSWORD');
  const editorPass = env('EDITOR_PASSWORD');
  if (user === 'admin' && adminPass && same(pass, adminPass)) return 'admin';
  if (user === 'editor' && editorPass && same(pass, editorPass)) return 'editor';
  return null;
}

export const challenge = () =>
  new Response('Acceso restringido', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Panel SUPERCASA", charset="UTF-8"', 'Cache-Control': 'no-store' },
  });
