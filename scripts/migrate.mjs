// Aplica las migraciones de supabase/migrations en orden, una sola vez cada una.
// Uso: DATABASE_URL=postgres://… npm run db:migrate
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✖ Falta DATABASE_URL (cadena de conexión de Postgres / Supabase).');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: !url.includes(':6543'), onnotice: () => {} });
const dir = join(process.cwd(), 'supabase', 'migrations');

try {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const body = readFileSync(join(dir, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`✔ ${file}`);
    applied++;
  }
  console.log(applied ? `Listo: ${applied} migración(es) aplicada(s).` : 'La base de datos ya está al día.');
} catch (err) {
  console.error('✖ Error aplicando migraciones:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
