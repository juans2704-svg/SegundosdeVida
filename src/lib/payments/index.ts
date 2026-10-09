import { payments, regions, type Region } from '../../config/payments';
import type { PaymentProvider } from './types';
import { wompiProvider } from './wompi';
import { paypalProvider } from './paypal';
import { demoProvider } from './demo';

export * from './types';

export function buildReference(amountCOP: number) {
  return `SC-${Date.now()}-${amountCOP}`;
}

/** Proveedor real según la región; en modo demo se simula conservando su nombre. */
export function providerFor(region: Region): PaymentProvider {
  const real = regions[region].provider === 'wompi' ? wompiProvider : paypalProvider;
  return payments.mode === 'demo' ? demoProvider(real) : real;
}
