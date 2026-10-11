import { env } from '../env';
import type { Store } from './types';
import { createMemoryStore } from './memory';
import { createPostgresStore } from './postgres';

let store: Store | null = null;

/** Postgres si hay DATABASE_URL; si no, memoria (solo para desarrollo). */
export function getStore(): Store {
  if (!store) {
    const url = env('DATABASE_URL');
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
