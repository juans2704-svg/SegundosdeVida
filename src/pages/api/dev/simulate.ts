import type { APIRoute } from 'astro';
import { simulateResult } from '../../../server/donations';
import { simulationAllowed } from '../../../server/wompi';
import { json, errorResponse, readJson } from '../../../server/http';

export const prerender = false;

const STATUSES = new Set(['APPROVED', 'DECLINED', 'PENDING', 'ERROR']);

/**
 * Solo en modo de pruebas sin llaves de Wompi: simula el resultado de un pago.
 * Genera un aviso firmado y lo procesa igual que uno real.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!simulationAllowed()) return json({ error: 'No disponible.' }, 404);
  try {
    const { reference, status } = (await readJson(request)) as { reference?: string; status?: string };
    if (!reference || !status || !STATUSES.has(status)) return json({ error: 'Datos no válidos.' }, 400);
    const d = await simulateResult(reference, status as 'APPROVED');
    if (!d) return json({ error: 'No encontramos esa donación.' }, 404);
    return json({ reference: d.reference, status: d.status });
  } catch (err) {
    return errorResponse(err);
  }
};
