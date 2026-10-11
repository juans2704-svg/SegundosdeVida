import { defineMiddleware } from 'astro:middleware';
import { panelEnabled, roleFor, challenge } from './server/auth';

/** Protege el panel de administración y sus endpoints. */
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) return next();
  if (context.isPrerendered) return next();
  if (!panelEnabled()) return new Response('No encontrado', { status: 404 });
  const role = roleFor(context.request);
  if (!role) return challenge();
  context.locals.role = role;
  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex');
  return response;
});
