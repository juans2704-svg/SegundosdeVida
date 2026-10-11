import type { APIRoute } from 'astro';
import { donationByTransaction } from '../../../server/donations';
import { json, errorResponse } from '../../../server/http';

export const prerender = false;

/** Cuando Wompi devuelve a la persona (PSE, Bancolombia) con `?id=<transacción>`. */
export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id') ?? '';
    if (!/^[\w-]{3,80}$/.test(id)) return json({ error: 'Transacción no válida.' }, 400);
    const d = await donationByTransaction(id);
    if (!d) return json({ error: 'No encontramos esa transacción.' }, 404);
    return json({ reference: d.reference, status: d.status, frequency: d.frequency, pieceId: d.pieceId, donorName: d.donorName, amount: d.chargeAmount, currency: d.currency });
  } catch (err) {
    return errorResponse(err);
  }
};
