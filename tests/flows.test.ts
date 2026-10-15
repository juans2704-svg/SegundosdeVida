/**
 * Flujos completos de donación y Plan Padrino con Wompi simulado.
 * Corre contra el almacén en memoria y, si existe TEST_DATABASE_URL, contra PostgreSQL real.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { setStore, getStore } from '../src/server/db';
import { createMemoryStore } from '../src/server/db/memory';
import { createPostgresStore } from '../src/server/db/postgres';
import {
  createDonation,
  simulateResult,
  processWompiEvent,
  createSubscription,
  chargeDueSubscriptions,
  cancelSubscription,
  recordManualDonation,
  confirmPaypalDonation,
  donationStatus,
  MAX_FAILED_ATTEMPTS,
} from '../src/server/donations';
import { buildSignedEvent, mockTransaction, getWompiConfig } from '../src/server/wompi';
import { parseOrder, ValidationError } from '../src/server/validate';
import { todayBogota, nextMonthOn, addDays } from '../src/server/dates';

for (const k of ['WOMPI_PRIVATE_KEY', 'WOMPI_PUBLIC_KEY', 'PUBLIC_WOMPI_PUBLIC_KEY', 'DATABASE_URL']) delete process.env[k];
// Los flujos de Wompi se prueban con Wompi encendido; abajo hay una prueba con Wompi apagado.
process.env.PUBLIC_WOMPI_ENABLED = 'true';

const order = (over: Record<string, unknown> = {}) =>
  parseOrder({
    region: 'co',
    pieceId: 'ventana',
    frequency: 'once',
    coverFee: true,
    donor: { name: 'Laura', email: 'Laura@Example.com', phone: '3001234567', consent: true, showOnWall: true },
    ...over,
  });

const backends: [string, () => Promise<void>][] = [['memoria', async () => setStore(createMemoryStore())]];

const pgUrl = process.env.TEST_DATABASE_URL;
let admin: ReturnType<typeof postgres> | null = null;
if (pgUrl) {
  backends.push([
    'postgres',
    async () => {
      await admin!`truncate donations, subscriptions, payment_events restart identity cascade`;
      setStore(createPostgresStore(pgUrl));
    },
  ]);
}

beforeAll(() => {
  if (pgUrl) admin = postgres(pgUrl, { max: 1, onnotice: () => {} });
});
afterAll(async () => {
  await admin?.end();
});

it('sin llaves de Wompi, el servidor trabaja en modo simulado', () => {
  expect(getWompiConfig().mode).toBe('mock');
});

it('con Wompi apagado solo se recibe por PayPal', async () => {
  setStore(createMemoryStore());
  process.env.PUBLIC_WOMPI_ENABLED = 'false';
  try {
    await expect(createDonation(order())).rejects.toThrow(/PayPal/);
    await expect(createSubscription(order({ frequency: 'monthly', pieceId: 'pintura' }), { token: 'tok_demo_approved' })).rejects.toThrow(/PayPal/);
    await expect(createDonation(order({ region: 'intl', pieceId: 'ventana' }))).resolves.toMatchObject({ provider: 'paypal' });
  } finally {
    process.env.PUBLIC_WOMPI_ENABLED = 'true';
  }
});

it('en producción sin llaves, la simulación y los pagos se bloquean', async () => {
  setStore(createMemoryStore());
  process.env.VERCEL_ENV = 'production';
  try {
    await expect(createDonation(order())).rejects.toThrow(/mantenimiento/);
    await expect(simulateResult('SC-x', 'APPROVED')).rejects.toThrow(/desactivada/);
    // PayPal no depende de Wompi: sigue disponible
    await expect(createDonation(order({ region: 'intl', pieceId: 'libre', custom: 25 }))).resolves.toMatchObject({ provider: 'paypal' });
  } finally {
    delete process.env.VERCEL_ENV;
  }
});

describe('validación de lo que envía el navegador', () => {
  it('exige correo válido y autorización de datos', () => {
    expect(() => order({ donor: { email: 'no-es-correo', consent: true } })).toThrow(ValidationError);
    expect(() => order({ donor: { email: 'a@b.co', consent: false } })).toThrow(/autorización/);
  });
  it('exige número de documento si se pide certificado', () => {
    expect(() => order({ donor: { email: 'a@b.co', consent: true, certificate: { docType: 'NIT', docNumber: '' } } })).toThrow(/documento/);
    const o = order({ donor: { email: 'a@b.co', consent: true, name: 'ACME', certificate: { docType: 'NIT', docNumber: '900.123.456-7' } } });
    expect(o.donor.certificate).toEqual({ name: 'ACME', docType: 'NIT', docNumber: '900.123.456-7' });
  });
});

for (const [name, reset] of backends) {
  describe(`flujos (${name})`, () => {
    beforeEach(reset);

    it('donación única aprobada: suma al recaudo, cuenta un héroe y aparece en el muro', async () => {
      const c = await createDonation(order());
      expect(c).toMatchObject({ provider: 'wompi', currency: 'COP', amountInCents: 10420000, simulated: true });
      expect(c.integrity).toMatch(/^[a-f0-9]{64}$/);
      expect((await getStore().getDonation(c.reference))?.status).toBe('pending');
      expect(await getStore().progress()).toEqual({ raisedCOP: 0, heroes: 0 });

      const d = await simulateResult(c.reference, 'APPROVED');
      expect(d?.status).toBe('approved');
      expect(d?.donorEmail).toBe('laura@example.com');
      expect(await getStore().progress()).toEqual({ raisedCOP: 100000, heroes: 1 });
      expect(await getStore().wall(10)).toEqual([{ name: 'Laura', pieceId: 'ventana' }]);
    });

    it('un mismo aviso dos veces no suma dos veces; un aviso posterior no cambia una donación ya cerrada', async () => {
      const c = await createDonation(order());
      const tx = mockTransaction(c.reference, c.amountInCents, 'APPROVED');
      const ev = buildSignedEvent(tx, getWompiConfig().eventsSecret);
      await processWompiEvent(ev);
      await processWompiEvent(ev);
      await processWompiEvent(buildSignedEvent({ ...tx, status: 'DECLINED' }, getWompiConfig().eventsSecret));
      expect((await getStore().getDonation(c.reference))?.status).toBe('approved');
      expect((await getStore().progress()).raisedCOP).toBe(100000);
    });

    it('rechaza avisos con firma inválida y los deja registrados', async () => {
      const c = await createDonation(order());
      const ev = buildSignedEvent(mockTransaction(c.reference, c.amountInCents, 'APPROVED'), 'secreto-falso');
      expect(await processWompiEvent(ev)).toEqual({ ok: false, reason: 'firma inválida' });
      expect((await getStore().getDonation(c.reference))?.status).toBe('pending');
    });

    it('no aprueba si el monto cobrado no coincide con el de la donación', async () => {
      const c = await createDonation(order());
      const ev = buildSignedEvent(mockTransaction(c.reference, 100, 'APPROVED'), getWompiConfig().eventsSecret);
      await processWompiEvent(ev);
      const d = await getStore().getDonation(c.reference);
      expect(d?.status).toBe('error');
      expect(d?.statusMessage).toMatch(/Monto no coincide/);
      expect((await getStore().progress()).raisedCOP).toBe(0);
    });

    it('pago rechazado y pendiente', async () => {
      const a = await createDonation(order());
      expect((await simulateResult(a.reference, 'DECLINED'))?.status).toBe('declined');
      const b = await createDonation(order());
      expect((await simulateResult(b.reference, 'PENDING'))?.status).toBe('pending');
      expect((await donationStatus(b.reference))?.status).toBe('pending');
      expect((await getStore().progress()).raisedCOP).toBe(0);
    });

    it('héroes cuenta personas distintas (mismo correo, dos aportes = un héroe)', async () => {
      for (const email of ['a@b.co', 'A@B.co', 'c@d.co']) {
        const c = await createDonation(order({ donor: { email, consent: true } }));
        await simulateResult(c.reference, 'APPROVED');
      }
      expect(await getStore().progress()).toEqual({ raisedCOP: 300000, heroes: 2 });
    });

    it('PayPal: queda pendiente hasta que el admin confirma; solo se confirma una vez', async () => {
      const c = await createDonation(order({ region: 'intl', pieceId: 'libre', custom: 25, coverFee: false }));
      expect(c).toMatchObject({ provider: 'paypal', currency: 'USD', simulated: false });
      expect(c.paymentUrl).toMatch(/^https:\/\/www\.paypal\.com\//);
      expect((await getStore().progress()).raisedCOP).toBe(0);
      const d = await confirmPaypalDonation(c.reference, true, 'admin');
      expect(d.status).toBe('approved');
      expect((await getStore().progress()).raisedCOP).toBe(d.amountCOP);
      await expect(confirmPaypalDonation(c.reference, false, 'admin')).rejects.toThrow(/pendiente/);
      // descartar uno que nunca llegó
      const c2 = await createDonation(order({ region: 'intl', pieceId: 'libre', custom: 10, coverFee: false }));
      expect((await confirmPaypalDonation(c2.reference, false, 'admin')).status).toBe('voided');
      // no sirve para aportes de Wompi
      const w = await createDonation(order());
      await expect(confirmPaypalDonation(w.reference, true, 'admin')).rejects.toThrow(/PayPal/);
    });

    it('aporte manual (transferencia) suma de inmediato', async () => {
      await recordManualDonation({ name: 'Empresa X', amountCOP: 5_000_000, notes: 'Transferencia #123' }, 'admin');
      expect((await getStore().progress()).raisedCOP).toBe(5_000_000);
      await expect(recordManualDonation({ amountCOP: -5 }, 'admin')).rejects.toThrow(ValidationError);
    });

    it('Plan Padrino: primer cobro aprobado activa el plan y programa el siguiente mes', async () => {
      const r = await createSubscription(order({ frequency: 'monthly', pieceId: 'pintura' }), { token: 'tok_demo_approved' });
      expect(r.status).toBe('approved');
      const s = await getStore().getSubscription(r.subscriptionId);
      expect(s).toMatchObject({ status: 'active', cardLast4: '4242', failedAttempts: 0, amountCOP: 50000, chargeAmount: 52500 });
      const anchor = Math.min(28, Number(todayBogota(new Date(s!.createdAt)).slice(8)));
      expect(s!.nextChargeOn).toBe(nextMonthOn(todayBogota(), anchor));
      expect(await getStore().progress()).toEqual({ raisedCOP: 50000, heroes: 1 });
      expect((await getStore().stats()).activeSubscriptions).toBe(1);
    });

    it('Plan Padrino: primer cobro rechazado deja el plan como no activado', async () => {
      const r = await createSubscription(order({ frequency: 'monthly', pieceId: 'pintura' }), { token: 'tok_demo_declined' });
      expect(r.status).toBe('declined');
      expect((await getStore().getSubscription(r.subscriptionId))?.status).toBe('failed');
      expect((await getStore().progress()).raisedCOP).toBe(0);
    });

    it('Plan Padrino: el cron cobra al vencer, una sola vez por mes', async () => {
      const r = await createSubscription(order({ frequency: 'monthly', pieceId: 'pintura' }), { token: 'tok_demo_approved' });
      const s = (await getStore().getSubscription(r.subscriptionId))!;
      expect((await chargeDueSubscriptions(todayBogota())).due).toBe(0); // todavía no vence

      const due = s.nextChargeOn!;
      const run1 = await chargeDueSubscriptions(due);
      expect(run1.results).toEqual([{ subscriptionId: s.id, reference: expect.stringMatching(/^SCM-/), status: 'approved' }]);
      expect((await getStore().progress()).raisedCOP).toBe(100000);

      // El plan ya no vence ese día; aunque se fuerce, no se cobra dos veces el mismo mes
      await getStore().updateSubscription(s.id, { nextChargeOn: due });
      const run2 = await chargeDueSubscriptions(due);
      expect(run2.results[0].status).toBe('skipped');
      expect((await getStore().progress()).raisedCOP).toBe(100000);
    });

    it(`Plan Padrino: tras ${MAX_FAILED_ATTEMPTS} cobros rechazados el plan se pausa`, async () => {
      const r = await createSubscription(order({ frequency: 'monthly', pieceId: 'pintura' }), { token: 'tok_demo_approved' });
      // La tarjeta empieza a rechazar
      await getStore().updateSubscription(r.subscriptionId, { paymentSourceId: 'mock-src-tok_demo_declined' });
      let day = (await getStore().getSubscription(r.subscriptionId))!.nextChargeOn!;
      for (let i = 1; i <= MAX_FAILED_ATTEMPTS; i++) {
        await chargeDueSubscriptions(day);
        const s = (await getStore().getSubscription(r.subscriptionId))!;
        expect(s.failedAttempts).toBe(i);
        if (i < MAX_FAILED_ATTEMPTS) {
          expect(s.status).toBe('active');
          expect(s.nextChargeOn).toBe(addDays(day, 3));
          day = s.nextChargeOn!;
        } else expect(s.status).toBe('past_due');
      }
      expect((await getStore().progress()).raisedCOP).toBe(50000);
    });

    it('cancelar el plan detiene los cobros', async () => {
      const r = await createSubscription(order({ frequency: 'monthly', pieceId: 'pintura' }), { token: 'tok_demo_approved' });
      const s = (await getStore().getSubscription(r.subscriptionId))!;
      const c = await cancelSubscription(s.cancelToken);
      expect(c?.status).toBe('cancelled');
      expect((await chargeDueSubscriptions(s.nextChargeOn!)).due).toBe(0);
      expect(await cancelSubscription('no-existe')).toBeNull();
    });

    it('el Plan Padrino desde el exterior y la habitación mensual no se permiten', async () => {
      await expect(createSubscription(order({ frequency: 'monthly', region: 'intl', pieceId: 'pintura' }), { token: 'x' })).rejects.toThrow(/Colombia/);
      await expect(createSubscription(order({ frequency: 'monthly', pieceId: 'habitacion' }), { token: 'x' })).rejects.toThrow(ValidationError);
    });
  });
}
