// Borra las donaciones y planes de prueba (origen "demo") antes del lanzamiento.
// Uso: DATABASE_URL=postgres://… npm run db:clear-demo
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✖ Falta DATABASE_URL.');
  process.exit(1);
}
const sql = postgres(url, { max: 1, prepare: !url.includes(':6543') });
try {
  const subs = await sql`select distinct subscription_id from donations where source = 'demo' and subscription_id is not null`;
  const d = await sql`delete from donations where source = 'demo'`;
  const s = subs.length ? await sql`delete from subscriptions where id in ${sql(subs.map((r) => r.subscription_id))}` : { count: 0 };
  console.log(`✔ Borradas ${d.count} donaciones y ${s.count} planes de prueba.`);
} finally {
  await sql.end();
}
