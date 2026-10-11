/**
 * Lógica de donaciones y Plan Padrino.
 *
 * Regla de oro: una donación solo pasa a "aprobada" cuando Wompi lo confirma
 * (aviso firmado o consulta directa a su API). Nada que diga el navegador
 * cambia el recaudo.
 */
import { randomBytes } from 'node:crypto';
import { getStore } from './db';
import type { Donation, DonationStatus, Subscription } from './db/types';
import {
  getWompiConfig,
  simulationAllowed,
  integritySignature,
  verifyEvent,
  parseTransaction,
  createPaymentSource,
  chargePaymentSource,
  getTransaction,
  waitForFinal,
  mockTransaction,
  buildSignedEvent,
  type WompiEvent,
  type WompiStatus,
  type WompiTransaction,
} from './wompi';
import { quote } from '../lib/pricing';
import { todayBogota, period, addDays, nextMonthOn } from './dates';
import { ValidationError, type OrderInput } from './validate';
import { pieces } from '../config/campaign';

/** Reintentos de un cobro mensual rechazado antes de pausar el plan. */
export const MAX_FAILED_ATTEMPTS = 3;
export const RETRY_AFTER_DAYS = 3;

const STATUS: Record<WompiStatus, DonationStatus> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  VOIDED: 'voided',
  ERROR: 'error',
};

const rand = (n = 3) => randomBytes(n).toString('hex');
const sourceFor = () => (getWompiConfig().mode === 'mock' ? 'demo' : 'wompi');

function quoteOrThrow(o: OrderInput) {
  const q = quote(o);
  if ('error' in q) throw new ValidationError(q.error);
  return q;
}

// ---------------------------------------------------------------------------
// Donación única
// ---------------------------------------------------------------------------
export interface Checkout {
  reference: string;
  provider: 'wompi' | 'paypal';
  currency: 'COP' | 'USD';
  amountInCents: number;
  publicKey: string;
  integrity: string | null;
  simulated: boolean;
}

function assertPaymentsConfigured() {
  if (getWompiConfig().mode === 'mock' && !simulationAllowed()) {
    throw Object.assign(new Error('Los pagos están en mantenimiento. Inténtalo en unos minutos 💛'), { status: 503 });
  }
}

export async function createDonation(o: OrderInput): Promise<Checkout> {
  if (o.frequency !== 'once') throw new ValidationError('Para el Plan Padrino usa /api/subscriptions.');
  assertPaymentsConfigured();
  const q = quoteOrThrow(o);
  const cfg = getWompiConfig();
  if (q.provider === 'paypal' && cfg.mode !== 'mock') {
    throw Object.assign(new ValidationError('El pago desde el exterior estará disponible muy pronto. Escríbenos y te ayudamos 💛'), { status: 503 });
  }
  const reference = `SC-${Date.now()}-${q.amountCOP}-${rand()}`;
  await getStore().insertDonation({
    reference,
    status: 'pending',
    source: cfg.mode === 'mock' ? 'demo' : q.provider,
    frequency: 'once',
    subscriptionId: null,
    pieceId: q.piece.id,
    amountCOP: q.amountCOP,
    currency: q.currency,
    chargeAmount: q.total,
    fee: q.fee,
    donorName: o.donor.name,
    donorEmail: o.donor.email,
    donorPhone: o.donor.phone,
    consent: true,
    showOnWall: o.donor.showOnWall,
    certificate: o.donor.certificate,
    notes: null,
    createdBy: null,
  });
  return {
    reference,
    provider: q.provider,
    currency: q.currency,
    amountInCents: q.totalInCents,
    publicKey: cfg.publicKey,
    integrity: q.currency === 'COP' ? integritySignature(reference, q.totalInCents, 'COP', cfg.integritySecret) : null,
    simulated: cfg.mode === 'mock',
  };
}

// ---------------------------------------------------------------------------
// Aplicar el resultado de una transacción (aviso de Wompi o consulta directa)
// ---------------------------------------------------------------------------
export async function applyTransaction(tx: WompiTransaction, today = todayBogota()): Promise<Donation | null> {
  const store = getStore();
  const donation = await store.getDonation(tx.reference);
  if (!donation) return null;

  const expectedCents = Math.round(donation.chargeAmount * 100);
  if (donation.currency === 'COP' && tx.amountInCents !== expectedCents) {
    return store.transitionDonation(tx.reference, ['pending'], {
      status: 'error',
      providerTransactionId: tx.id,
      statusMessage: `Monto no coincide: esperado ${expectedCents}, recibido ${tx.amountInCents}`,
    });
  }

  const status = STATUS[tx.status] ?? 'error';
  const base = { providerTransactionId: tx.id, paymentMethod: tx.paymentMethodType, statusMessage: tx.statusMessage };
  if (status === 'pending') {
    return (await store.transitionDonation(tx.reference, ['pending'], base)) ?? donation;
  }
  const updated = await store.transitionDonation(tx.reference, ['pending'], {
    ...base,
    status,
    approvedAt: status === 'approved' ? new Date().toISOString() : null,
  });
  if (!updated) return store.getDonation(tx.reference); // ya estaba procesada: idempotente
  if (updated.subscriptionId) await afterSubscriptionCharge(updated, today);
  return updated;
}

/** Procesa un aviso (webhook) de Wompi. */
export async function processWompiEvent(event: WompiEvent): Promise<{ ok: boolean; reason?: string }> {
  const cfg = getWompiConfig();
  const valid = verifyEvent(event, cfg.eventsSecret);
  const tx = event?.data?.transaction;
  await getStore().logEvent({
    provider: 'wompi',
    event: event?.event ?? null,
    reference: tx?.reference ? String(tx.reference) : null,
    signatureValid: valid,
    payload: event,
  });
  if (!valid) return { ok: false, reason: 'firma inválida' };
  if (event.event !== 'transaction.updated' || !tx) return { ok: true, reason: 'evento ignorado' };
  await applyTransaction(parseTransaction(tx));
  return { ok: true };
}

/** Estado de una donación; si sigue pendiente y hay id de transacción, consulta a Wompi. */
export async function donationStatus(reference: string, transactionId?: string | null) {
  const store = getStore();
  let donation = await store.getDonation(reference);
  if (!donation) return null;
  const txId = transactionId || donation.providerTransactionId;
  if (donation.status === 'pending' && txId) {
    const tx = await getTransaction(getWompiConfig(), txId);
    if (tx && tx.reference === reference) donation = (await applyTransaction(tx)) ?? donation;
  }
  return donation;
}

/** Busca la donación de una transacción (cuando Wompi devuelve a la persona con `?id=`). */
export async function donationByTransaction(transactionId: string) {
  const tx = await getTransaction(getWompiConfig(), transactionId);
  if (!tx) return null;
  return (await applyTransaction(tx)) ?? (await getStore().getDonation(tx.reference));
}

/** Modo de pruebas sin llaves: simula el resultado de Wompi pasando por el mismo camino que un aviso real. */
export async function simulateResult(reference: string, status: WompiStatus) {
  const cfg = getWompiConfig();
  if (!simulationAllowed()) throw Object.assign(new Error('Simulación desactivada.'), { status: 403 });
  const donation = await getStore().getDonation(reference);
  if (!donation) return null;
  const tx = mockTransaction(reference, Math.round(donation.chargeAmount * 100), status);
  await processWompiEvent(buildSignedEvent(tx, cfg.eventsSecret));
  return getStore().getDonation(reference);
}

// ---------------------------------------------------------------------------
// Plan Padrino (mensual)
// ---------------------------------------------------------------------------
const chargePrefix = (s: Subscription, day: string) => `SCM-${s.id.slice(0, 8)}-${period(day)}`;
const anchorDay = (s: Subscription) => Math.min(28, Number(todayBogota(new Date(s.createdAt)).slice(8, 10)));

async function charge(s: Subscription, reference: string, today = todayBogota()): Promise<Donation | null> {
  const store = getStore();
  const cfg = getWompiConfig();
  await store.insertDonation({
    reference,
    status: 'pending',
    source: sourceFor(),
    frequency: 'monthly',
    subscriptionId: s.id,
    pieceId: s.pieceId,
    amountCOP: s.amountCOP,
    currency: s.currency,
    chargeAmount: s.chargeAmount,
    fee: s.fee,
    donorName: s.donorName,
    donorEmail: s.donorEmail,
    donorPhone: s.donorPhone,
    consent: s.consent,
    showOnWall: s.showOnWall,
    certificate: s.certificate,
    notes: null,
    createdBy: null,
  });
  try {
    let tx = await chargePaymentSource(cfg, {
      paymentSourceId: s.paymentSourceId!,
      reference,
      amountInCents: Math.round(s.chargeAmount * 100),
      email: s.donorEmail,
    });
    tx = await waitForFinal(cfg, tx);
    return applyTransaction(tx, today);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failed = await store.transitionDonation(reference, ['pending'], { status: 'error', statusMessage: message.slice(0, 500) });
    if (failed) await afterSubscriptionCharge(failed, today);
    return failed;
  }
}

/** Ajusta el plan después de que un cobro mensual queda aprobado o rechazado. */
async function afterSubscriptionCharge(d: Donation, today: string) {
  const store = getStore();
  const s = await store.getSubscription(d.subscriptionId!);
  if (!s) return;
  if (d.status === 'approved') {
    await store.updateSubscription(s.id, {
      status: 'active',
      nextChargeOn: nextMonthOn(today, anchorDay(s)),
      failedAttempts: 0,
      lastError: null,
    });
    return;
  }
  if (d.status === 'pending') return;
  if (s.status === 'pending') {
    await store.updateSubscription(s.id, { status: 'failed', lastError: d.statusMessage ?? d.status });
    return;
  }
  const attempts = s.failedAttempts + 1;
  await store.updateSubscription(s.id, {
    failedAttempts: attempts,
    lastError: d.statusMessage ?? d.status,
    ...(attempts >= MAX_FAILED_ATTEMPTS ? { status: 'past_due' as const } : { nextChargeOn: addDays(today, RETRY_AFTER_DAYS) }),
  });
}

export interface SubscriptionResult {
  subscriptionId: string;
  reference: string;
  status: DonationStatus;
  cancelToken: string;
}

/** Alta del Plan Padrino: guarda la tarjeta (tokenizada por Wompi) y hace el primer cobro de inmediato. */
export async function createSubscription(o: OrderInput, payment: { token: string; type?: 'CARD' | 'NEQUI' }): Promise<SubscriptionResult> {
  if (o.frequency !== 'monthly') throw new ValidationError('Frecuencia no válida para el Plan Padrino.');
  assertPaymentsConfigured();
  const q = quoteOrThrow(o);
  if (q.currency !== 'COP') throw new ValidationError('Por ahora el Plan Padrino está disponible solo desde Colombia.');
  if (!payment.token || payment.token.length > 200) throw new ValidationError('No recibimos los datos de pago. ¿Intentamos otra vez?');

  const store = getStore();
  const cfg = getWompiConfig();
  let s = await store.insertSubscription({
    provider: 'wompi',
    pieceId: q.piece.id,
    currency: 'COP',
    amountCOP: q.amountCOP,
    chargeAmount: q.total,
    fee: q.fee,
    donorName: o.donor.name,
    donorEmail: o.donor.email,
    donorPhone: o.donor.phone,
    consent: true,
    showOnWall: o.donor.showOnWall,
    certificate: o.donor.certificate,
  });

  try {
    const source = await createPaymentSource(cfg, { token: payment.token, email: o.donor.email, type: payment.type });
    s = (await store.updateSubscription(s.id, {
      paymentSourceId: source.id,
      paymentMethod: source.type,
      cardBrand: source.brand,
      cardLast4: source.last4,
    }))!;
  } catch (err) {
    await store.updateSubscription(s.id, { status: 'failed', lastError: err instanceof Error ? err.message.slice(0, 500) : 'error' });
    throw Object.assign(new Error('No pudimos guardar el medio de pago. Revisa los datos e intenta otra vez.'), { status: 402 });
  }

  const reference = chargePrefix(s, todayBogota());
  const first = await charge(s, reference);
  return { subscriptionId: s.id, reference, status: first?.status ?? 'error', cancelToken: s.cancelToken };
}

/** Cobra los planes que vencen hoy (lo llama el cron diario). Idempotente: no cobra dos veces el mismo mes. */
export async function chargeDueSubscriptions(today = todayBogota()) {
  const store = getStore();
  const due = await store.dueSubscriptions(today);
  const results: { subscriptionId: string; reference: string | null; status: string }[] = [];
  for (const s of due) {
    const prefix = chargePrefix(s, today);
    const previous = await store.subscriptionCharges(s.id, prefix);
    if (previous.some((d) => d.status === 'approved' || d.status === 'pending')) {
      results.push({ subscriptionId: s.id, reference: null, status: 'skipped' });
      continue;
    }
    const reference = previous.length ? `${prefix}-R${previous.length}` : prefix;
    const d = await charge(s, reference, today);
    results.push({ subscriptionId: s.id, reference, status: d?.status ?? 'error' });
  }
  return { date: today, due: due.length, results };
}

export async function cancelSubscription(token: string) {
  const store = getStore();
  const s = await store.getSubscriptionByCancelToken(token);
  if (!s) return null;
  if (s.status === 'cancelled') return s;
  return store.updateSubscription(s.id, { status: 'cancelled', cancelledAt: new Date().toISOString(), nextChargeOn: null });
}

// ---------------------------------------------------------------------------
// Aportes registrados a mano (transferencias, efectivo)
// ---------------------------------------------------------------------------
export async function recordManualDonation(
  input: { name?: string; email?: string; amountCOP: number; pieceId?: string; notes?: string; showOnWall?: boolean },
  admin: string,
) {
  const amount = Math.floor(Number(input.amountCOP));
  if (!amount || amount <= 0 || amount > 2_000_000_000) throw new ValidationError('Monto no válido.');
  const pieceId = pieces.some((p) => p.id === input.pieceId) ? input.pieceId! : 'libre';
  return getStore().insertDonation({
    reference: `SC-MAN-${Date.now()}-${rand()}`,
    status: 'approved',
    source: 'manual',
    frequency: 'once',
    subscriptionId: null,
    pieceId,
    amountCOP: amount,
    currency: 'COP',
    chargeAmount: amount,
    fee: 0,
    donorName: input.name?.trim().slice(0, 60) || null,
    donorEmail: input.email?.trim().toLowerCase().slice(0, 254) || null,
    donorPhone: null,
    consent: true,
    showOnWall: Boolean(input.showOnWall),
    certificate: null,
    notes: input.notes?.trim().slice(0, 500) || null,
    createdBy: admin,
    approvedAt: new Date().toISOString(),
  });
}
