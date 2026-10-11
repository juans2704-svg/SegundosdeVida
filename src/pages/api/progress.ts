import type { APIRoute } from 'astro';
import { getStore } from '../../server/db';
import { campaign, pieces } from '../../config/campaign';
import { json, errorResponse } from '../../server/http';
import { getWompiConfig, simulationAllowed } from '../../server/wompi';

export const prerender = false;

/** Recaudo público: lo consulta la portada al abrir y cada minuto. */
export const GET: APIRoute = async () => {
  try {
    const store = getStore();
    const [p, wall] = await Promise.all([store.progress(), store.wall(30)]);
    return json(
      {
        raised: p.raisedCOP,
        heroes: p.heroes,
        goal: campaign.goal,
        wall: wall.map((w) => ({ name: w.name, icon: pieces.find((x) => x.id === w.pieceId)?.icon ?? '⭐' })),
        updatedAt: new Date().toISOString(),
        // La llave pública de Wompi no es secreta: el navegador la necesita para el widget.
        payments: { simulated: simulationAllowed(), publicKey: getWompiConfig().publicKey },
      },
      200,
      { 'Cache-Control': 'public, max-age=15, s-maxage=15' },
    );
  } catch (err) {
    return errorResponse(err);
  }
};
