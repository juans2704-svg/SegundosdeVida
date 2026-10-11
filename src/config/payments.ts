/**
 * Configuración de pagos.
 *
 * - `demo`: no se cobra nada. Un modal simula el checkout para probar todo el
 *   flujo (aprobado / pendiente / rechazado / error de red).
 * - `live`: usa Wompi (Colombia, COP) y PayPal (exterior, USD).
 *   Requiere la fase 2: el endpoint que firma la transacción de Wompi
 *   (firma de integridad) y el webhook que confirma pagos.
 */

export type PaymentsMode = 'demo' | 'live';
export type Region = 'co' | 'intl';

const envMode = import.meta.env.PUBLIC_PAYMENTS_MODE as PaymentsMode | undefined;

export const payments = {
  mode: (envMode === 'live' ? 'live' : 'demo') as PaymentsMode,

  /** PENDIENTE: tasa de referencia para mostrar valores aproximados en USD. */
  usdRate: 4_000,

  minAmount: { COP: 10_000, USD: 3 },

  /**
   * Comisión de la pasarela, para la opción "cubrir la comisión".
   * COP: Wompi Plan Avanzado, 2,65 % + $700 + IVA (19 %) por transacción exitosa.
   * USD: PENDIENTE tarifa real de PayPal (valor de referencia).
   */
  fees: {
    COP: { pct: 0.0265, fixed: 700, vat: 0.19 },
    USD: { pct: 0.054, fixed: 0.3, vat: 0 },
  },

  wompi: {
    publicKey: import.meta.env.PUBLIC_WOMPI_PUBLIC_KEY ?? 'pub_test_REEMPLAZAR',
    widgetUrl: 'https://checkout.wompi.co/widget.js',
    /** Fase 2: Edge Function de Supabase que devuelve la firma de integridad. */
    signatureEndpoint: '/api/wompi/signature',
    redirectUrl: '/?pago=resultado',
    methods: 'Tarjetas, PSE, Nequi, Daviplata y efectivo',
  },

  paypal: {
    clientId: import.meta.env.PUBLIC_PAYPAL_CLIENT_ID ?? 'REEMPLAZAR',
    methods: 'PayPal o tarjeta internacional',
  },
};

export const regions: Record<Region, { currency: 'COP' | 'USD'; provider: 'wompi' | 'paypal' }> = {
  co: { currency: 'COP', provider: 'wompi' },
  intl: { currency: 'USD', provider: 'paypal' },
};
