import { describe, it, expect } from 'vitest';
import { integritySignature, eventChecksum, verifyEvent, buildSignedEvent, mockTransaction } from '../src/server/wompi';

describe('Wompi: firmas', () => {
  it('firma de integridad igual al ejemplo oficial de la documentación de Wompi', () => {
    expect(
      integritySignature('sk8-438k4-xmxm392-sn2m', 2490000, 'COP', 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6'),
    ).toBe('37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5');
  });

  it('checksum de evento: concatena las propiedades + timestamp + secreto (vector de regresión, confirmar en sandbox)', () => {
    const event = {
      data: { transaction: { id: '1234-1610641025-49201', status: 'APPROVED', amount_in_cents: 4490000 } },
      signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], checksum: '' },
      timestamp: 1530291411,
    };
    expect(eventChecksum(event, 'prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z').toUpperCase()).toBe(
      '5A18EC5E8FDB7DF463E9F94774CBA8F583BA21BD04A09CEFF2EA68A4BC0AEFBE',
    );
  });

  it('acepta un evento bien firmado (mayúsculas o minúsculas) y rechaza uno alterado', () => {
    const ev = buildSignedEvent(mockTransaction('SC-1-1000-abc', 100000, 'APPROVED'), 'secreto');
    expect(verifyEvent(ev, 'secreto')).toBe(true);
    expect(verifyEvent({ ...ev, signature: { ...ev.signature, checksum: ev.signature.checksum.toUpperCase() } }, 'secreto')).toBe(true);
    const tampered = structuredClone(ev);
    tampered.data.transaction!.amount_in_cents = 1;
    expect(verifyEvent(tampered, 'secreto')).toBe(false);
    expect(verifyEvent(ev, 'otro-secreto')).toBe(false);
    expect(verifyEvent(ev, '')).toBe(false);
  });
});
