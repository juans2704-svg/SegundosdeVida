import type { APIRoute } from 'astro';
import { cancelSubscription } from '../../../server/donations';
import { json, errorResponse, readJson } from '../../../server/http';

export const prerender = false;

/** Cancela un Plan Padrino con el enlace personal que recibe el padrino por correo. */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { token } = (await readJson(request)) as { token?: string };
    if (!token || !/^[a-f0-9]{20,80}$/.test(token)) return json({ error: 'Enlace no válido.' }, 400);
    const s = await cancelSubscription(token);
    if (!s) return json({ error: 'No encontramos ese plan.' }, 404);
    return json({ status: s.status });
  } catch (err) {
    return errorResponse(err);
  }
};
