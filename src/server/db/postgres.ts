/**
 * Almacén en PostgreSQL (Supabase en producción, Postgres local en pruebas).
 * Con el pooler de Supabase en modo transacción (puerto 6543) hay que
 * desactivar las sentencias preparadas: se detecta por el puerto.
 */
import postgres from 'postgres';
import type {
  Store,
  Donation,
  NewDonation,
  DonationPatch,
  DonationStatus,
  Subscription,
  NewSubscription,
  SubscriptionPatch,
  PaymentEvent,
  Stats,
} from './types';

type Row = Record<string, unknown>;

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : str(v));

function toDonation(r: Row): Donation {
  return {
    id: String(r.id),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    reference: String(r.reference),
    status: r.status as Donation['status'],
    source: r.source as Donation['source'],
    frequency: r.frequency as Donation['frequency'],
    subscriptionId: str(r.subscription_id),
    pieceId: String(r.piece_id),
    amountCOP: num(r.amount_cop),
    currency: String(r.currency),
    chargeAmount: num(r.charge_amount),
    fee: num(r.fee),
    donorName: str(r.donor_name),
    donorEmail: str(r.donor_email),
    donorPhone: str(r.donor_phone),
    consent: Boolean(r.consent),
    showOnWall: Boolean(r.show_on_wall),
    certificate: (r.certificate as Donation['certificate']) ?? null,
    providerTransactionId: str(r.provider_transaction_id),
    paymentMethod: str(r.payment_method),
    statusMessage: str(r.status_message),
    approvedAt: iso(r.approved_at),
    notes: str(r.notes),
    createdBy: str(r.created_by),
  };
}

function toSubscription(r: Row): Subscription {
  return {
    id: String(r.id),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    status: r.status as Subscription['status'],
    provider: String(r.provider),
    pieceId: String(r.piece_id),
    currency: String(r.currency),
    amountCOP: num(r.amount_cop),
    chargeAmount: num(r.charge_amount),
    fee: num(r.fee),
    donorName: str(r.donor_name),
    donorEmail: String(r.donor_email),
    donorPhone: str(r.donor_phone),
    consent: Boolean(r.consent),
    showOnWall: Boolean(r.show_on_wall),
    certificate: (r.certificate as Subscription['certificate']) ?? null,
    paymentSourceId: str(r.payment_source_id),
    paymentMethod: str(r.payment_method),
    cardBrand: str(r.card_brand),
    cardLast4: str(r.card_last4),
    nextChargeOn: str(r.next_charge_on),
    failedAttempts: num(r.failed_attempts),
    lastError: str(r.last_error),
    cancelToken: String(r.cancel_token),
    cancelledAt: iso(r.cancelled_at),
  };
}

const donationCols: Record<string, string> = {
  reference: 'reference',
  status: 'status',
  source: 'source',
  frequency: 'frequency',
  subscriptionId: 'subscription_id',
  pieceId: 'piece_id',
  amountCOP: 'amount_cop',
  currency: 'currency',
  chargeAmount: 'charge_amount',
  fee: 'fee',
  donorName: 'donor_name',
  donorEmail: 'donor_email',
  donorPhone: 'donor_phone',
  consent: 'consent',
  showOnWall: 'show_on_wall',
  certificate: 'certificate',
  providerTransactionId: 'provider_transaction_id',
  paymentMethod: 'payment_method',
  statusMessage: 'status_message',
  approvedAt: 'approved_at',
  notes: 'notes',
  createdBy: 'created_by',
};

const subscriptionCols: Record<string, string> = {
  status: 'status',
  provider: 'provider',
  pieceId: 'piece_id',
  currency: 'currency',
  amountCOP: 'amount_cop',
  chargeAmount: 'charge_amount',
  fee: 'fee',
  donorName: 'donor_name',
  donorEmail: 'donor_email',
  donorPhone: 'donor_phone',
  consent: 'consent',
  showOnWall: 'show_on_wall',
  certificate: 'certificate',
  paymentSourceId: 'payment_source_id',
  paymentMethod: 'payment_method',
  cardBrand: 'card_brand',
  cardLast4: 'card_last4',
  nextChargeOn: 'next_charge_on',
  failedAttempts: 'failed_attempts',
  lastError: 'last_error',
  cancelledAt: 'cancelled_at',
};

function columns(obj: Record<string, unknown>, map: Record<string, string>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || !(k in map)) continue;
    out[map[k]] = v;
  }
  return out;
}

/** Conexión cifrada para cualquier base que no sea local (Supabase). */
export const sslFor = (url: string) => (/@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : ('require' as const));

export function createPostgresStore(url: string): Store {
  const sql = postgres(url, {
    ssl: sslFor(url),
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    prepare: !url.includes(':6543'),
    idle_timeout: 20,
    onnotice: () => {},
    types: {
      // `date` como texto YYYY-MM-DD (sin conversión de zona horaria)
      date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
    },
  });
  const json = (v: unknown) => (v === null || v === undefined ? null : sql.json(v as never));

  return {
    kind: 'postgres',

    async insertDonation(d: NewDonation) {
      const row = columns({ ...d, certificate: json(d.certificate) }, donationCols);
      const [r] = await sql`insert into donations ${sql(row)} returning *`;
      return toDonation(r);
    },

    async getDonation(reference) {
      const [r] = await sql`select * from donations where reference = ${reference}`;
      return r ? toDonation(r) : null;
    },

    async transitionDonation(reference, from: DonationStatus[], patch: DonationPatch) {
      const row = columns(patch, donationCols);
      if (!Object.keys(row).length) return this.getDonation(reference);
      const [r] = await sql`
        update donations set ${sql(row)}
        where reference = ${reference} and status in ${sql(from)}
        returning *`;
      return r ? toDonation(r) : null;
    },

    async subscriptionCharges(subscriptionId, referencePrefix) {
      const rows = await sql`
        select * from donations
        where subscription_id = ${subscriptionId} and reference like ${referencePrefix + '%'}
        order by created_at`;
      return rows.map(toDonation);
    },

    async listDonations(limit) {
      const rows = await sql`select * from donations order by created_at desc limit ${limit}`;
      return rows.map(toDonation);
    },

    async progress() {
      const [r] = await sql`select raised_cop, heroes from campaign_progress`;
      return { raisedCOP: num(r?.raised_cop), heroes: num(r?.heroes) };
    },

    async wall(limit) {
      const rows = await sql`
        select donor_name, piece_id from donations
        where status = 'approved' and show_on_wall
        order by approved_at desc nulls last
        limit ${limit}`;
      return rows.map((r) => ({ name: str(r.donor_name), pieceId: String(r.piece_id) }));
    },

    async insertSubscription(s: NewSubscription) {
      const row = columns({ ...s, certificate: json(s.certificate) }, subscriptionCols);
      const [r] = await sql`insert into subscriptions ${sql(row)} returning *`;
      return toSubscription(r);
    },

    async getSubscription(id) {
      const [r] = await sql`select * from subscriptions where id = ${id}`;
      return r ? toSubscription(r) : null;
    },

    async getSubscriptionByCancelToken(token) {
      const [r] = await sql`select * from subscriptions where cancel_token = ${token}`;
      return r ? toSubscription(r) : null;
    },

    async updateSubscription(id, patch) {
      const row = columns(patch, subscriptionCols);
      if (!Object.keys(row).length) return this.getSubscription(id);
      const [r] = await sql`update subscriptions set ${sql(row)} where id = ${id} returning *`;
      return r ? toSubscription(r) : null;
    },

    async dueSubscriptions(today) {
      const rows = await sql`
        select * from subscriptions
        where status = 'active' and next_charge_on <= ${today}
        order by next_charge_on`;
      return rows.map(toSubscription);
    },

    async listSubscriptions(limit) {
      const rows = await sql`select * from subscriptions order by created_at desc limit ${limit}`;
      return rows.map(toSubscription);
    },

    async logEvent(e: PaymentEvent) {
      await sql`
        insert into payment_events (provider, event, reference, signature_valid, payload)
        values (${e.provider}, ${e.event}, ${e.reference}, ${e.signatureValid}, ${json(e.payload)})`;
    },

    async stats(): Promise<Stats> {
      const [p] = await sql`select raised_cop, heroes, approved_donations from campaign_progress`;
      const [s] = await sql`
        select count(*)::int as active, coalesce(sum(amount_cop), 0)::bigint as monthly
        from subscriptions where status = 'active'`;
      return {
        raisedCOP: num(p?.raised_cop),
        heroes: num(p?.heroes),
        approvedDonations: num(p?.approved_donations),
        activeSubscriptions: num(s?.active),
        monthlyCOP: num(s?.monthly),
      };
    },
  };
}
