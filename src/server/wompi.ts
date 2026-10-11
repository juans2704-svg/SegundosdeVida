/**
 * Cliente de Wompi (servidor).
 * Docs: https://docs.wompi.co/docs/colombia/
 *
 * Modos (automático según las llaves configuradas):
 * - `mock`: sin llaves. Simula a Wompi en memoria para probar todo el flujo sin
 *   cobrar. El resultado del cobro mensual depende del token de prueba
 *   (`…_approved`, `…_declined`, `…_pending`, `…_error`).
 * - `sandbox`: llaves `pub_test_` / `prv_test_`. Entorno de pruebas real de Wompi.
 * - `production`: llaves `pub_prod_` / `prv_prod_`.
 *
 * VERIFICAR EN SANDBOX antes de producción (los nombres exactos de campos de
 * aceptación y de fuentes de pago pueden cambiar entre versiones de la API):
 * `getAcceptanceTokens`, `createPaymentSource` y `createTransaction` con
 * `payment_source_id` + `recurrent`.
 */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { env, isProductionDeploy } from './env';

export type WompiMode = 'mock' | 'sandbox' | 'production';
export type WompiStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export interface WompiConfig {
  mode: WompiMode;
  publicKey: string;
  privateKey: string;
  integritySecret: string;
  eventsSecret: string;
  baseUrl: string;
}

export interface WompiTransaction {
  id: string;
  status: WompiStatus;
  reference: string;
  amountInCents: number;
  currency: string;
  paymentMethodType: string | null;
  statusMessage: string | null;
}

export interface WompiEvent {
  event: string;
  data: { transaction?: Record<string, unknown> } & Record<string, unknown>;
  environment?: string;
  signature: { properties: string[]; checksum: string };
  timestamp: number;
  sent_at?: string;
}

const MOCK = {
  publicKey: 'pub_test_MOCK',
  integritySecret: 'test_integrity_MOCK',
  eventsSecret: 'test_events_MOCK',
};

export function getWompiConfig(): WompiConfig {
  const publicKey = env('WOMPI_PUBLIC_KEY') || env('PUBLIC_WOMPI_PUBLIC_KEY');
  const privateKey = env('WOMPI_PRIVATE_KEY');
  if (!privateKey || !publicKey || publicKey.includes('REEMPLAZAR')) {
    return { mode: 'mock', publicKey: MOCK.publicKey, privateKey: '', integritySecret: MOCK.integritySecret, eventsSecret: MOCK.eventsSecret, baseUrl: '' };
  }
  const production = publicKey.startsWith('pub_prod_');
  return {
    mode: production ? 'production' : 'sandbox',
    publicKey,
    privateKey,
    integritySecret: env('WOMPI_INTEGRITY_SECRET'),
    eventsSecret: env('WOMPI_EVENTS_SECRET'),
    baseUrl: production ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1',
  };
}

/**
 * La simulación (modo mock) solo se permite fuera de producción: así nadie
 * puede inflar el recaudo con pagos simulados si faltan las llaves.
 */
export const simulationAllowed = () => getWompiConfig().mode === 'mock' && !isProductionDeploy();

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Firma de integridad: SHA256(referencia + montoEnCentavos + moneda + secreto). */
export function integritySignature(reference: string, amountInCents: number, currency: string, secret: string) {
  return sha256(`${reference}${amountInCents}${currency}${secret}`);
}

function valueAt(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Checksum de un evento: SHA256(valores de signature.properties + timestamp + secreto de eventos). */
export function eventChecksum(event: Pick<WompiEvent, 'data' | 'signature' | 'timestamp'>, secret: string) {
  const values = event.signature.properties.map((p) => String(valueAt(event.data, p) ?? '')).join('');
  return sha256(`${values}${event.timestamp}${secret}`);
}

export function verifyEvent(event: WompiEvent, secret: string): boolean {
  if (!secret || !event?.signature?.checksum || !Array.isArray(event.signature.properties)) return false;
  const expected = Buffer.from(eventChecksum(event, secret).toLowerCase());
  const got = Buffer.from(String(event.signature.checksum).toLowerCase());
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export function parseTransaction(t: Record<string, unknown>): WompiTransaction {
  return {
    id: String(t.id),
    status: String(t.status) as WompiStatus,
    reference: String(t.reference),
    amountInCents: Number(t.amount_in_cents),
    currency: String(t.currency ?? 'COP'),
    paymentMethodType: t.payment_method_type ? String(t.payment_method_type) : null,
    statusMessage: t.status_message ? String(t.status_message) : null,
  };
}

// ---------------------------------------------------------------------------
// Simulador (modo mock)
// ---------------------------------------------------------------------------
const mockTransactions = new Map<string, WompiTransaction>();

function mockStatusFromToken(token: string): WompiStatus {
  if (token.endsWith('_declined')) return 'DECLINED';
  if (token.endsWith('_pending')) return 'PENDING';
  if (token.endsWith('_error')) return 'ERROR';
  return 'APPROVED';
}

/** Arma un evento `transaction.updated` firmado, idéntico a los que envía Wompi. */
export function buildSignedEvent(tx: WompiTransaction, secret: string): WompiEvent {
  const event: WompiEvent = {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: tx.id,
        status: tx.status,
        reference: tx.reference,
        amount_in_cents: tx.amountInCents,
        currency: tx.currency,
        payment_method_type: tx.paymentMethodType ?? 'CARD',
        status_message: tx.statusMessage,
      },
    },
    environment: 'test',
    signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], checksum: '' },
    timestamp: Math.floor(Date.now() / 1000),
    sent_at: new Date().toISOString(),
  };
  event.signature.checksum = eventChecksum(event, secret);
  return event;
}

export function mockTransaction(reference: string, amountInCents: number, status: WompiStatus): WompiTransaction {
  const tx: WompiTransaction = {
    id: `mock-${randomUUID().slice(0, 8)}`,
    status,
    reference,
    amountInCents,
    currency: 'COP',
    paymentMethodType: 'CARD',
    statusMessage: status === 'DECLINED' ? 'Transacción rechazada (simulada)' : null,
  };
  mockTransactions.set(tx.id, tx);
  return tx;
}

// ---------------------------------------------------------------------------
// API real
// ---------------------------------------------------------------------------
async function call<T>(cfg: WompiConfig, path: string, init: RequestInit & { auth?: 'public' | 'private' } = {}): Promise<T> {
  const key = init.auth === 'public' ? cfg.publicKey : cfg.privateKey;
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: unknown; error?: unknown };
  if (!res.ok) {
    throw new Error(`Wompi ${path} → ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
  }
  return body.data as T;
}

/** Tokens de aceptación (términos y tratamiento de datos) que exige Wompi para crear fuentes de pago. */
export async function getAcceptanceTokens(cfg: WompiConfig) {
  if (cfg.mode === 'mock') return { acceptance: 'mock_acceptance', personalData: 'mock_personal' };
  const data = await call<Record<string, { acceptance_token?: string } | undefined>>(cfg, `/merchants/${cfg.publicKey}`, {
    auth: 'public',
  });
  return {
    acceptance: data.presigned_acceptance?.acceptance_token ?? '',
    personalData: data.presigned_personal_data_auth?.acceptance_token ?? '',
  };
}

export interface PaymentSource {
  id: string;
  type: string;
  brand: string | null;
  last4: string | null;
}

/** Crea una fuente de pago a partir del token de la tarjeta (obtenido en el navegador con el widget de Wompi). */
export async function createPaymentSource(
  cfg: WompiConfig,
  input: { token: string; email: string; type?: 'CARD' | 'NEQUI' },
): Promise<PaymentSource> {
  if (cfg.mode === 'mock') {
    return { id: `mock-src-${input.token}`, type: input.type ?? 'CARD', brand: 'VISA', last4: '4242' };
  }
  const tokens = await getAcceptanceTokens(cfg);
  const data = await call<Record<string, unknown>>(cfg, '/payment_sources', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type ?? 'CARD',
      token: input.token,
      customer_email: input.email,
      acceptance_token: tokens.acceptance,
      accept_personal_auth: tokens.personalData,
    }),
  });
  const pub = (data.public_data ?? {}) as Record<string, unknown>;
  return {
    id: String(data.id),
    type: String(data.type ?? input.type ?? 'CARD'),
    brand: pub.brand ? String(pub.brand) : null,
    last4: pub.last_four ? String(pub.last_four) : null,
  };
}

/** Cobra a una fuente de pago guardada (Plan Padrino). */
export async function chargePaymentSource(
  cfg: WompiConfig,
  input: { paymentSourceId: string; reference: string; amountInCents: number; email: string },
): Promise<WompiTransaction> {
  if (cfg.mode === 'mock') {
    const token = input.paymentSourceId.replace('mock-src-', '');
    return mockTransaction(input.reference, input.amountInCents, mockStatusFromToken(token));
  }
  const data = await call<Record<string, unknown>>(cfg, '/transactions', {
    method: 'POST',
    body: JSON.stringify({
      amount_in_cents: input.amountInCents,
      currency: 'COP',
      signature: integritySignature(input.reference, input.amountInCents, 'COP', cfg.integritySecret),
      customer_email: input.email,
      payment_method: { installments: 1 },
      reference: input.reference,
      payment_source_id: Number(input.paymentSourceId) || input.paymentSourceId,
      recurrent: true,
    }),
  });
  return parseTransaction(data);
}

export async function getTransaction(cfg: WompiConfig, id: string): Promise<WompiTransaction | null> {
  if (cfg.mode === 'mock') return mockTransactions.get(id) ?? null;
  try {
    return parseTransaction(await call<Record<string, unknown>>(cfg, `/transactions/${encodeURIComponent(id)}`, { auth: 'public' }));
  } catch {
    return null;
  }
}

/** Espera a que una transacción deje de estar PENDING (Wompi suele resolver en segundos con tarjeta). */
export async function waitForFinal(cfg: WompiConfig, tx: WompiTransaction, timeoutMs = 12_000): Promise<WompiTransaction> {
  let current = tx;
  const start = Date.now();
  while (current.status === 'PENDING' && Date.now() - start < timeoutMs && cfg.mode !== 'mock') {
    await new Promise((r) => setTimeout(r, 1500));
    current = (await getTransaction(cfg, tx.id)) ?? current;
  }
  return current;
}
