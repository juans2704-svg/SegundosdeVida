import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { pieces } from '../../../config/campaign';

export const prerender = false;

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  // Evita que Excel ejecute fórmulas escritas en un campo (inyección CSV)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Exporta todas las donaciones en CSV (para seguimiento y certificados). */
export const GET: APIRoute = async () => {
  const rows = await getStore().listDonations(100_000);
  const header = [
    'fecha', 'referencia', 'estado', 'origen', 'frecuencia', 'pieza', 'valor_pieza_cop', 'moneda', 'cobrado', 'comision_cubierta',
    'nombre', 'correo', 'whatsapp', 'muro', 'certificado_nombre', 'certificado_tipo', 'certificado_numero', 'id_transaccion', 'medio', 'notas',
  ];
  const lines = rows.map((d) =>
    [
      d.createdAt, d.reference, d.status, d.source, d.frequency, pieces.find((p) => p.id === d.pieceId)?.label ?? d.pieceId, d.amountCOP,
      d.currency, d.chargeAmount, d.fee, d.donorName, d.donorEmail, d.donorPhone, d.showOnWall ? 'sí' : 'no', d.certificate?.name,
      d.certificate?.docType, d.certificate?.docNumber, d.providerTransactionId, d.paymentMethod, d.notes,
    ].map(cell).join(','),
  );
  const body = '﻿' + [header.join(','), ...lines].join('\r\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="donaciones-supercasa-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
