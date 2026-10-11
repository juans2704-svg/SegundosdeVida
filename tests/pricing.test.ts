import { describe, it, expect } from 'vitest';
import { quote } from '../src/lib/pricing';
import { feeCover } from '../src/lib/format';

describe('Montos', () => {
  it('pieza fija en COP, sin y con comisión', () => {
    const a = quote({ region: 'co', pieceId: 'ventana', frequency: 'once', coverFee: false });
    expect(a).toMatchObject({ amountCOP: 100000, amount: 100000, fee: 0, totalInCents: 10000000, provider: 'wompi' });
    const b = quote({ region: 'co', pieceId: 'ventana', frequency: 'once', coverFee: true });
    expect(b).toMatchObject({ fee: 4200, total: 104200, totalInCents: 10420000 });
  });

  it('cubrir la comisión deja completo el aporte después de la tarifa de Wompi (2,65 % + $700 + IVA)', () => {
    for (const amount of [10000, 50000, 100000, 250000, 1000000, 7777777]) {
      const total = amount + feeCover(amount, 'COP');
      const wompiFee = (total * 0.0265 + 700) * 1.19;
      expect(total - wompiFee).toBeGreaterThanOrEqual(amount);
      expect(total - wompiFee - amount).toBeLessThan(150);
    }
  });

  it('monto libre: mínimo, máximo y USD', () => {
    expect(quote({ region: 'co', pieceId: 'libre', frequency: 'once', coverFee: false })).toHaveProperty('error');
    expect(quote({ region: 'co', pieceId: 'libre', frequency: 'once', custom: 5000, coverFee: false })).toHaveProperty('error');
    expect(quote({ region: 'co', pieceId: 'libre', frequency: 'once', custom: 60_000_000, coverFee: false })).toHaveProperty('error');
    expect(quote({ region: 'intl', pieceId: 'libre', frequency: 'once', custom: 25, coverFee: false })).toMatchObject({
      currency: 'USD',
      amount: 25,
      amountCOP: 100000,
      provider: 'paypal',
    });
  });

  it('la habitación no se ofrece como aporte mensual y una pieza inventada no existe', () => {
    expect(quote({ region: 'co', pieceId: 'habitacion', frequency: 'monthly', coverFee: false })).toHaveProperty('error');
    expect(quote({ region: 'co', pieceId: 'piscina', frequency: 'once', coverFee: false })).toHaveProperty('error');
  });
});
