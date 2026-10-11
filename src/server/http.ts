import { ValidationError } from './validate';

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

/** Convierte un error en respuesta: mensajes de validación para la persona, y uno genérico para lo demás. */
export function errorResponse(err: unknown) {
  const status = (err as { status?: number })?.status;
  if (err instanceof ValidationError || (status && status < 500 && err instanceof Error)) {
    return json({ error: (err as Error).message }, status ?? 400);
  }
  if (status === 503 && err instanceof Error) return json({ error: err.message }, 503);
  console.error('[SUPERCASA]', err);
  return json({ error: 'Se nos cayó la conexión, como los bloques de Calvito 😅 Inténtalo de nuevo.' }, 500);
}

export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new ValidationError('Formato no válido.');
  const text = await request.text();
  if (text.length > 20_000) throw new ValidationError('Solicitud demasiado grande.');
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError('Formato no válido.');
  }
}

// Límite simple de solicitudes por IP (por instancia del servidor).
const hits = new Map<string, number[]>();
export function rateLimited(request: Request, clientAddress: string | undefined, max = 12, windowMs = 60_000) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'local';
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

export const tooMany = () => json({ error: 'Vas muy rápido, héroe 😅 Espera un momento e inténtalo de nuevo.' }, 429);
