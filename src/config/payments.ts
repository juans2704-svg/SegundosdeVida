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

export const payments = {
  mode: (envMode === 'live' ? 'live' : 'demo') as PaymentsMode,

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
