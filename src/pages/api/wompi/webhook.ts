import type { APIRoute } from 'astro';
import { processWompiEvent } from '../../../server/donations';
import { json } from '../../../server/http';

export const prerender = false;

/**
 * Aviso de eventos de Wompi. Configurar en el panel de Wompi:
 * URL de eventos = https://<dominio>/api/wompi/webhook
 * Responde 200 siempre que el evento se haya registrado, para que Wompi no reintente sin fin.
 */
export const POST: APIRoute = async ({ request }) => {
  let event;
  try {
    event = await request.json();
  } catch {
    return json({ ok: false, reason: 'json inválido' }, 400);
  }
  try {
    const result = await processWompiEvent(event);
    return json(result, result.ok ? 200 : 401);
  } catch (err) {
    console.error('[SUPERCASA] webhook', err);
    return json({ ok: false }, 500);
  }
};
