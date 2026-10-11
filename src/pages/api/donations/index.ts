import type { APIRoute } from 'astro';
import { createDonation } from '../../../server/donations';
import { parseOrder } from '../../../server/validate';
import { json, errorResponse, readJson, rateLimited, tooMany } from '../../../server/http';

export const prerender = false;

/** Crea una donación única pendiente y devuelve los datos firmados para abrir el checkout. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (rateLimited(request, clientAddress)) return tooMany();
  try {
    const order = parseOrder(await readJson(request));
    return json(await createDonation(order), 201);
  } catch (err) {
    return errorResponse(err);
  }
};
