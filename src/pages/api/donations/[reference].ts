import type { APIRoute } from 'astro';
import { donationStatus } from '../../../server/donations';
import { json, errorResponse } from '../../../server/http';

export const prerender = false;

/** Estado de una donación (sin datos personales). `?tx=` permite consultar a Wompi si sigue pendiente. */
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const d = await donationStatus(params.reference ?? '', url.searchParams.get('tx'));
    if (!d) return json({ error: 'No encontramos esa donación.' }, 404);
    return json({ reference: d.reference, status: d.status, frequency: d.frequency, pieceId: d.pieceId });
  } catch (err) {
    return errorResponse(err);
  }
};
