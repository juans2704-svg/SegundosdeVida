import { afterEach, describe, expect, it } from 'vitest';
import { databaseUrl } from '../src/server/db';

const saved = { DATABASE_URL: process.env.DATABASE_URL, POSTGRES_URL: process.env.POSTGRES_URL };
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('databaseUrl', () => {
  it('usa POSTGRES_URL de la integración Supabase ↔ Vercel y quita sus parámetros', () => {
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = 'postgres://postgres.abc:pw1@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
    expect(databaseUrl()).toBe('postgres://postgres.abc:pw1@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
  });

  it('DATABASE_URL tiene prioridad', () => {
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/db';
    process.env.POSTGRES_URL = 'postgres://otra';
    expect(databaseUrl()).toBe('postgres://u:p@localhost:5432/db');
  });
});
