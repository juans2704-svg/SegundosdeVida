import type { APIRoute } from 'astro';
import { confirmPaypalDonation } from '../../../server/donations';
import { json, errorResponse, readJson } from '../../../server/http';

export const prerender = false;

/** Confirma o descarta un aporte de PayPal pendiente. Solo rol admin. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.role !== 'admin') return json({ error: 'Solo el administrador puede confirmar aportes.' }, 403);
  try {
    const body = (await readJson(request)) as Record<string, unknown>;
    if (typeof body.reference !== 'string') return json({ error: 'Falta la referencia.' }, 400);
    const d = await confirmPaypalDonation(body.reference, body.approve === true, 'admin');
    return json({ reference: d.reference, status: d.status });
  } catch (err) {
    return errorResponse(err);
  }
};
