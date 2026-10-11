// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

/**
 * La landing es estática (rápida, servida desde CDN) y solo /api/*, /admin y
 * /padrino/* se ejecutan en el servidor.
 * - En Vercel (variable VERCEL presente) se usa el adaptador de Vercel.
 * - En cualquier otro lado, un servidor Node: `node dist/server/entry.mjs`.
 */
const adapter = process.env.VERCEL ? vercel() : node({ mode: 'standalone' });

// PENDIENTE: dominio definitivo de la campaña.
export default defineConfig({
  site: 'https://supercasa.segundosdevida.com',
  output: 'static',
  adapter,
  build: { inlineStylesheets: 'auto' },
  security: { checkOrigin: true },
});
