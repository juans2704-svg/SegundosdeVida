/**
 * Cliente del servidor de la landing (navegador).
 * Si no hay servidor (p. ej. la vista previa estática), `online()` devuelve
 * false y la página funciona en modo demostración local.
 */
export interface ServerProgress {
  raised: number;
  heroes: number;
  goal: number;
  wall: { name: string | null; icon: string }[];
  payments: { simulated: boolean; publicKey: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let probe: Promise<ServerProgress | null> | null = null;

async function fetchProgress(): Promise<ServerProgress | null> {
  try {
    const res = await fetch('/api/progress', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return null;
    return (await res.json()) as ServerProgress;
  } catch {
    return null;
  }
}

/** Primer contacto con el servidor (se reutiliza). */
export function firstProgress() {
  probe ??= fetchProgress();
  return probe;
}

export async function online() {
  return (await firstProgress()) !== null;
}

/** Recaudo actualizado (sin caché del primer contacto). */
export async function refreshProgress() {
  const p = await fetchProgress();
  if (p) probe = Promise.resolve(p);
  return p;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new ApiError('', 0);
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? '', res.status);
  return data;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? '', res.status);
  return data;
}

export interface DonationState {
  reference: string;
  status: 'pending' | 'approved' | 'declined' | 'voided' | 'error';
}

/** Consulta el estado de una donación hasta que deje de estar pendiente (o se acabe el tiempo). */
export async function pollStatus(reference: string, transactionId?: string, timeoutMs = 25_000): Promise<DonationState> {
  const start = Date.now();
  const q = transactionId ? `?tx=${encodeURIComponent(transactionId)}` : '';
  let state = await get<DonationState>(`/api/donations/${encodeURIComponent(reference)}${q}`);
  while (state.status === 'pending' && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    state = await get<DonationState>(`/api/donations/${encodeURIComponent(reference)}${q}`);
  }
  return state;
}
