import { payments } from '../config/payments';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const usd = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** $250.000.000 */
export const formatCOP = (value: number) => cop.format(value).replace(/\s/g, '');

/** US$63 */
export const formatUSD = (value: number) => 'US' + usd.format(value).replace(/\s/g, '');

export const copToUSD = (value: number) => Math.max(1, Math.round(value / payments.usdRate));
export const usdToCOP = (value: number) => Math.round(value * payments.usdRate);

export const formatMoney = (value: number, currency: 'COP' | 'USD') =>
  currency === 'COP' ? formatCOP(value) : formatUSD(value);

/** Valor extra para que, después de la comisión de la pasarela, llegue completo el aporte. */
export function feeCover(amount: number, currency: 'COP' | 'USD') {
  const { pct, fixed } = payments.fees[currency];
  const gross = (amount + fixed) / (1 - pct);
  const extra = gross - amount;
  return currency === 'COP' ? Math.ceil(extra / 100) * 100 : Math.ceil(extra * 100) / 100;
}

export const formatUSDCents = (value: number) =>
  'US$' + value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
