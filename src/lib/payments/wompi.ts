/**
 * Wompi en el navegador: abre el checkout certificado de Wompi.
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 *
 * Los datos de tarjeta nunca pasan por nuestros servidores. El servidor solo:
 * - firma cada pago (firma de integridad) en /api/donations, y
 * - confirma el resultado con el aviso de Wompi o consultando su API.
 *
 * Plan Padrino: el widget en modo `tokenize` devuelve un token de la tarjeta
 * que el servidor convierte en una fuente de pago para los cobros mensuales.
 * VERIFICAR EN SANDBOX la forma exacta de la respuesta de `tokenize`.
 */
import { payments } from '../../config/payments';
import type { PaymentProvider, PaymentStatus } from './types';

type WidgetResult = Record<string, unknown> & { transaction?: { id: string; status: string } };

declare global {
  interface Window {
    WidgetCheckout?: new (config: Record<string, unknown>) => {
      open(cb: (result: WidgetResult) => void): void;
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

const STATUS: Record<string, PaymentStatus> = {
  APPROVED: 'approved',
  PENDING: 'pending',
  DECLINED: 'declined',
  VOIDED: 'declined',
  ERROR: 'error',
};

export interface ServerCheckout {
  reference: string;
  amountInCents: number;
  currency: 'COP' | 'USD';
  publicKey: string;
  integrity: string | null;
}

/** Abre el checkout para una donación única ya creada y firmada por el servidor. */
export async function openCheckout(
  checkout: ServerCheckout,
  donor: { name: string; email: string; phone: string },
): Promise<{ status: PaymentStatus; transactionId?: string }> {
  await loadWidget();
  const widget = new window.WidgetCheckout!({
    currency: 'COP',
    amountInCents: checkout.amountInCents,
    reference: checkout.reference,
    publicKey: checkout.publicKey,
    signature: { integrity: checkout.integrity },
    redirectUrl: new URL(payments.wompi.redirectUrl, location.origin).toString(),
    customerData: {
      email: donor.email,
      fullName: donor.name || 'Héroe anónimo',
      ...(donor.phone ? { phoneNumber: donor.phone.replace(/\D/g, '').slice(-10), phoneNumberPrefix: '+57' } : {}),
    },
  });
  return new Promise((resolve) => {
    widget.open((result) => {
      const tx = result.transaction;
      resolve(tx ? { status: STATUS[tx.status] ?? 'pending', transactionId: tx.id } : { status: 'cancelled' });
    });
  });
}

/** Tokeniza una tarjeta para el Plan Padrino. Devuelve null si la persona cierra el widget. */
export async function tokenizeCard(publicKey: string): Promise<{ token: string; type: 'CARD' | 'NEQUI' } | null> {
  await loadWidget();
  const widget = new window.WidgetCheckout!({ publicKey, widgetOperation: 'tokenize' });
  return new Promise((resolve) => {
    widget.open((result) => {
      // Formas de respuesta conocidas del modo tokenize
      const r = result as Record<string, Record<string, unknown> | undefined>;
      const token = (r.payment_source?.token ?? r.token?.id ?? r.card?.id ?? r.nequi?.id) as string | undefined;
      const type = r.nequi ? 'NEQUI' : 'CARD';
      resolve(token ? { token, type } : null);
    });
  });
}

export const wompiProvider: PaymentProvider = {
  id: 'wompi',
  label: 'Wompi',
  methods: payments.wompi.methods,
  async pay() {
    // El flujo con servidor usa openCheckout/tokenizeCard desde scripts/donation.ts.
    return { status: 'error' };
  },
};
