import type { APIRoute } from 'astro';
import { createSubscription } from '../../../server/donations';
import { parseOrder } from '../../../server/validate';
import { json, errorResponse, readJson, rateLimited, tooMany } from '../../../server/http';

export const prerender = false;

/** Alta del Plan Padrino: recibe el token de la tarjeta (de Wompi), guarda la fuente de pago y cobra el primer mes. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (rateLimited(request, clientAddress, 6)) return tooMany();
  try {
    const body = (await readJson(request)) as Record<string, unknown>;
    const order = parseOrder(body);
    const payment = (body.payment ?? {}) as Record<string, unknown>;
    const result = await createSubscription(order, {
      token: String(payment.token ?? ''),
      type: payment.type === 'NEQUI' ? 'NEQUI' : 'CARD',
    });
    return json({ subscriptionId: result.subscriptionId, reference: result.reference, status: result.status }, 201);
  } catch (err) {
    return errorResponse(err);
  }
};
