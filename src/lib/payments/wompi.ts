/**
 * Wompi Widget Checkout (Colombia · COP).
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 *
 * Los datos de tarjeta nunca tocan nuestros servidores: todo ocurre en el
 * checkout certificado de Wompi.
 *
 * Requisitos de fase 2:
 * - `signatureEndpoint`: función en el servidor que calcula
 *   SHA256(reference + amountInCents + currency + secreto_de_integridad).
 *   El secreto JAMÁS debe estar en el frontend.
 * - Webhook de eventos (`transaction.updated`) con verificación de firma, que
 *   es la fuente de verdad para sumar al recaudo.
 * - Plan Padrino mensual: tokenizar la fuente de pago y programar cobros
 *   recurrentes desde el backend (Wompi no tiene suscripciones en el widget).
 */
import { payments } from '../../config/payments';
import type { DonationOrder, PaymentProvider, PaymentResult } from './types';

declare global {
  interface Window {
    WidgetCheckout?: new (config: Record<string, unknown>) => {
      open(cb: (result: { transaction?: { id: string; status: string } }) => void): void;
    };
  }
}

let loading: Promise<void> | null = null;
function loadWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = payments.wompi.widgetUrl;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('wompi-widget'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

async function getIntegritySignature(order: DonationOrder): Promise<string> {
  const res = await fetch(payments.wompi.signatureEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference: order.reference, amountInCents: order.amountCOP * 100, currency: 'COP' }),
  });
  if (!res.ok) throw new Error('wompi-signature');
  const data = (await res.json()) as { integrity: string };
  return data.integrity;
}

const STATUS: Record<string, PaymentResult['status']> = {
  APPROVED: 'approved',
  PENDING: 'pending',
  DECLINED: 'declined',
  VOIDED: 'declined',
  ERROR: 'error',
};

export const wompiProvider: PaymentProvider = {
  id: 'wompi',
  label: 'Wompi',
  methods: payments.wompi.methods,
  async pay(order) {
    try {
      const [, integrity] = await Promise.all([loadWidget(), getIntegritySignature(order)]);
      const checkout = new window.WidgetCheckout!({
        currency: 'COP',
        amountInCents: order.amountCOP * 100,
        reference: order.reference,
        publicKey: payments.wompi.publicKey,
        signature: { integrity },
        redirectUrl: new URL(payments.wompi.redirectUrl, location.origin).toString(),
        customerData: {
          email: order.donor.email,
          fullName: order.donor.name || 'Héroe anónimo',
          ...(order.donor.phone ? { phoneNumber: order.donor.phone, phoneNumberPrefix: '+57' } : {}),
        },
      });
      return await new Promise<PaymentResult>((resolve) => {
        checkout.open((result) => {
          const tx = result.transaction;
          resolve({ status: tx ? (STATUS[tx.status] ?? 'error') : 'cancelled', transactionId: tx?.id });
        });
      });
    } catch {
      return { status: 'error' };
    }
  },
};
