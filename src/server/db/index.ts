import { env } from '../env';
import type { Store } from './types';
import { createMemoryStore } from './memory';
import { createPostgresStore } from './postgres';

let store: Store | null = null;

/**
 * Cadena de conexión: DATABASE_URL, o POSTGRES_URL si la creó la integración
 * Supabase ↔ Vercel. Se quitan los parámetros que agrega esa integración
 * (`sslmode`, `supa`): el SSL lo maneja `sslFor`.
 */
export function databaseUrl(): string {
  const raw = env('DATABASE_URL') || env('POSTGRES_URL');
  if (!raw) return '';
  try {
    const u = new URL(raw);
    u.searchParams.delete('sslmode');
    u.searchParams.delete('supa');
    return u.toString();
  } catch {
    return raw;
  }
}

/** Postgres si hay cadena de conexión; si no, memoria (solo para desarrollo). */
export function getStore(): Store {
  if (!store) {
    const url = databaseUrl();
    store = url ? createPostgresStore(url) : createMemoryStore();
    if (!url) console.warn('[SUPERCASA] Sin DATABASE_URL: los datos se guardan en memoria y se pierden al reiniciar.');
  }
  return store;
}

/** Para pruebas: inyecta un almacén. */
export function setStore(s: Store | null) {
  store = s;
}

export type * from './types';
