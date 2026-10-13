// Verifica que ningún texto de la landing use la palabra restringida (brief §4.2).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = /c[aá]ncer/i;
// Única excepción, aprobada por la directora: la definición de los Super Calvitos.
const ALLOWED = { file: join('src', 'i18n', 'es.ts'), phrase: 'diagnosticados con cáncer' };
const ROOTS = ['src', 'public'];
const EXT = /\.(astro|ts|js|mjs|md|json|html|svg|css)$/;

const hits = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (EXT.test(name)) {
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const allowed = path === ALLOWED.file && line.replace(ALLOWED.phrase, '').search(FORBIDDEN) === -1;
          if (FORBIDDEN.test(line) && !allowed) hits.push(`${path}:${i + 1}`);
        });
    }
  }
};
ROOTS.forEach(walk);

if (hits.length) {
  console.error('✖ Palabra restringida encontrada (brief §4.2):\n  ' + hits.join('\n  '));
  process.exit(1);
}
console.log('✔ Copy revisado: sin palabra restringida.');
