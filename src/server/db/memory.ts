/**
 * Almacén en memoria: para desarrollo sin base de datos y para pruebas.
 * Los datos se pierden al reiniciar el servidor.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import type { Store, Donation, Subscription, PaymentEvent } from './types';

export function createMemoryStore(): Store & { events: PaymentEvent[] } {
  const donations: Donation[] = [];
  const subscriptions: Subscription[] = [];
  const events: PaymentEvent[] = [];
  const now = () => new Date().toISOString();
  const clone = <T>(x: T): T => structuredClone(x);
  const approved = () => donations.filter((d) => d.status === 'approved');

  return {
    kind: 'memory',
    events,

    async insertDonation(d) {
      if (donations.some((x) => x.reference === d.reference)) {
        throw Object.assign(new Error('duplicate reference'), { code: '23505' });
      }
      const row: Donation = {
        providerTransactionId: null,
        paymentMethod: null,
        statusMessage: null,
        approvedAt: null,
        ...clone(d),
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now(),
      };
      donations.push(row);
      return clone(row);
    },

    async getDonation(reference) {
      const d = donations.find((x) => x.reference === reference);
      return d ? clone(d) : null;
    },

    async transitionDonation(reference, from, patch) {
      const d = donations.find((x) => x.reference === reference && from.includes(x.status));
      if (!d) return null;
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) (d as unknown as Record<string, unknown>)[k] = v;
      d.updatedAt = now();
      return clone(d);
    },

    async subscriptionCharges(subscriptionId, prefix) {
      return clone(donations.filter((d) => d.subscriptionId === subscriptionId && d.reference.startsWith(prefix)));
    },

    async listDonations(limit) {
      return clone([...donations].reverse().slice(0, limit));
    },

    async progress() {
      const a = approved();
      return {
        raisedCOP: a.reduce((s, d) => s + d.amountCOP, 0),
        heroes: new Set(a.map((d) => (d.donorEmail ?? d.id).toLowerCase())).size,
      };
    },

    async wall(limit) {
      return approved()
        .filter((d) => d.showOnWall)
        .sort((x, y) => (y.approvedAt ?? '').localeCompare(x.approvedAt ?? ''))
        .slice(0, limit)
        .map((d) => ({ name: d.donorName, pieceId: d.pieceId }));
    },

    async insertSubscription(s) {
      const row: Subscription = {
        ...clone(s),
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now(),
        status: 'pending',
        paymentSourceId: null,
        paymentMethod: null,
        cardBrand: null,
        cardLast4: null,
        nextChargeOn: null,
        failedAttempts: 0,
        lastError: null,
        cancelToken: randomBytes(18).toString('hex'),
        cancelledAt: null,
      };
      subscriptions.push(row);
      return clone(row);
    },

    async getSubscription(id) {
      const s = subscriptions.find((x) => x.id === id);
      return s ? clone(s) : null;
    },

    async getSubscriptionByCancelToken(token) {
      const s = subscriptions.find((x) => x.cancelToken === token);
      return s ? clone(s) : null;
    },

    async updateSubscription(id, patch) {
      const s = subscriptions.find((x) => x.id === id);
      if (!s) return null;
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) (s as unknown as Record<string, unknown>)[k] = v;
      s.updatedAt = now();
      return clone(s);
    },

    async dueSubscriptions(today) {
      return clone(subscriptions.filter((s) => s.status === 'active' && s.nextChargeOn && s.nextChargeOn <= today));
    },

    async listSubscriptions(limit) {
      return clone([...subscriptions].reverse().slice(0, limit));
    },

    async logEvent(e) {
      events.push(clone(e));
    },

    async stats() {
      const p = await this.progress();
      const active = subscriptions.filter((s) => s.status === 'active');
      return {
        ...p,
        approvedDonations: approved().length,
        activeSubscriptions: active.length,
        monthlyCOP: active.reduce((s, x) => s + x.amountCOP, 0),
      };
    },
  };
}
