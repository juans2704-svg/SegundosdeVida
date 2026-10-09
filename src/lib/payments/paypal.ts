/**
 * PayPal (donantes fuera de Colombia · USD).
 *
 * Fase 2 — pendiente de implementar con credenciales reales:
 * - Cargar el SDK: https://www.paypal.com/sdk/js?client-id=…&currency=USD
 *   (con `&vault=true&intent=subscription` para el Plan Padrino mensual).
 * - Única: crear la orden en el servidor (Orders v2) y capturarla al aprobar.
 * - Mensual: crear un plan de suscripción por monto en PayPal Billing.
 * - Webhook `PAYMENT.CAPTURE.COMPLETED` / `BILLING.SUBSCRIPTION.*` para sumar
 *   al recaudo convirtiendo USD→COP con la tasa del día.
 *
 * Alternativa si la fundación lo prefiere: Stripe Checkout (mismo contrato
 * `PaymentProvider`, solo cambia este archivo).
 */
import { payments } from '../../config/payments';
import type { PaymentProvider } from './types';

export const paypalProvider: PaymentProvider = {
  id: 'paypal',
  label: 'PayPal',
  methods: payments.paypal.methods,
  async pay() {
    console.warn('[SUPERCASA] PayPal aún no está configurado (fase 2).');
    return { status: 'error' };
  },
};
