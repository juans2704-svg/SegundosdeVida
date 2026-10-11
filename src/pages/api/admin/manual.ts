import type { APIRoute } from 'astro';
import { recordManualDonation } from '../../../server/donations';
import { json, errorResponse, readJson } from '../../../server/http';

export const prerender = false;

/** Registra un aporte recibido por fuera de la página (transferencia, efectivo). Solo rol admin. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.role !== 'admin') return json({ error: 'Solo el administrador puede registrar aportes.' }, 403);
  try {
    const body = (await readJson(request)) as Record<string, unknown>;
    const d = await recordManualDonation(
      {
        name: typeof body.name === 'string' ? body.name : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
        amountCOP: Number(body.amountCOP),
        pieceId: typeof body.pieceId === 'string' ? body.pieceId : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        showOnWall: body.showOnWall === true,
      },
      'admin',
    );
    return json({ reference: d.reference }, 201);
  } catch (err) {
    return errorResponse(err);
  }
};
