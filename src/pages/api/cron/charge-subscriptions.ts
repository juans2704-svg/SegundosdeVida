import type { APIRoute } from 'astro';
import { chargeDueSubscriptions } from '../../../server/donations';
import { env } from '../../../server/env';
import { json, errorResponse } from '../../../server/http';

export const prerender = false;

/**
 * Cobros mensuales del Plan Padrino. Lo llama un cron diario (vercel.json)
 * con el encabezado `Authorization: Bearer <CRON_SECRET>`.
 */
const run: APIRoute = async ({ request }) => {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'No autorizado.' }, 401);
  try {
    return json(await chargeDueSubscriptions());
  } catch (err) {
    return errorResponse(err);
  }
};

export const GET = run;
export const POST = run;
