/**
 * Configuración de pagos.
 *
 * - `demo`: no se cobra nada. Un modal simula el checkout para probar todo el
 *   flujo (aprobado / pendiente / rechazado / error de red).
 * - `live`: usa el checkout real de Wompi (Colombia, COP) y PayPal (exterior, USD).
 *   Con llaves `pub_test_…` Wompi funciona en su entorno de pruebas (sandbox):
 *   ese es el "modo de pruebas" con pagos de mentira pero el flujo real.
 */

export type PaymentsMode = 'demo' | 'live';
export type Region = 'co' | 'intl';

const envMode = import.meta.env.PUBLIC_PAYMENTS_MODE as PaymentsMode | undefined;

export type PaymentChannel = 'links' | 'transfer' | 'online';

/** Lee PUBLIC_PAYMENT_CHANNEL: `online`, `transfer` o, por defecto, `links`. */
export const channelFrom = (v: string | undefined): PaymentChannel => (v === 'online' || v === 'transfer' ? v : 'links');

export const payments = {
  mode: (envMode === 'live' ? 'live' : 'demo') as PaymentsMode,

  /**
   * Cómo se recibe el aporte (PUBLIC_PAYMENT_CHANNEL):
   * - `links` (por defecto): enlaces de pago de Wompi (tarjeta, PSE, Nequi, Bancolombia).
   *   Wompi no avisa a la página: el aporte queda pendiente y el admin lo confirma en /admin.
   *   Como alternativa se muestran los datos de la cuenta para transferir.
   * - `transfer`: solo datos de la cuenta Bancolombia.
   * - `online`: integración completa con Wompi/PayPal (llaves de API y avisos automáticos).
   */
  channel: channelFrom(import.meta.env.PUBLIC_PAYMENT_CHANNEL),

  /** Enlaces de pago creados en el panel de Wompi de la fundación. */
  wompiLinks: {
    open: 'https://checkout.wompi.co/l/r2Twsx',
    fixed: {
      50_000: 'https://checkout.wompi.co/l/HmCgCf',
      100_000: 'https://checkout.wompi.co/l/2NDA04',
      250_000: 'https://checkout.wompi.co/l/4VL5ZF',
      500_000: 'https://checkout.wompi.co/l/sLLqUE',
    } as Record<number, string>,
  },

  /**
   * Wompi (Colombia, COP y Plan Padrino). Apagado mientras la fundación termina
   * su cuenta: todos los aportes van por PayPal. Para encenderlo, poner
   * PUBLIC_WOMPI_ENABLED=true en Vercel y volver a publicar.
   */
  wompiEnabled: import.meta.env.PUBLIC_WOMPI_ENABLED === 'true',

  /** PENDIENTE: tasa de referencia para mostrar valores aproximados en USD. */
  usdRate: 4_000,

  minAmount: { COP: 10_000, USD: 3 },
  /** Tope por transacción en la web (montos mayores: escribir a tesorería). */
  maxAmount: { COP: 50_000_000, USD: 12_500 },

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
    /** Wompi vuelve aquí después de PSE / Bancolombia, agregando `?id=<transacción>`. */
    redirectUrl: '/?pago=resultado',
    methods: 'Tarjetas, PSE, Nequi, Daviplata y efectivo',
  },

  paypal: {
    /**
     * Enlace de pago de PayPal de la fundación (donantes del exterior, USD).
     * PayPal no avisa a la página: cada aporte queda "pendiente" y el admin lo
     * confirma en /admin cuando el dinero llega a la cuenta de PayPal.
     */
    link: import.meta.env.PUBLIC_PAYPAL_LINK ?? 'https://www.paypal.com/ncp/payment/ULLP6VT522LW6',
    clientId: import.meta.env.PUBLIC_PAYPAL_CLIENT_ID ?? 'REEMPLAZAR',
    methods: 'PayPal o tarjeta internacional',
  },
};

export const regions: Record<Region, { currency: 'COP' | 'USD'; provider: 'wompi' | 'paypal' }> = {
  co: { currency: 'COP', provider: 'wompi' },
  intl: { currency: 'USD', provider: 'paypal' },
};

/**
 * Enlace de Wompi para un valor: el de valor fijo si existe uno igual; si no,
 * el de valor abierto (el donante escribe el valor en Wompi).
 */
export function wompiLinkFor(amountCOP: number): { url: string; exact: boolean } {
  const fixed = payments.wompiLinks.fixed[amountCOP];
  return fixed ? { url: fixed, exact: true } : { url: payments.wompiLinks.open, exact: false };
}
