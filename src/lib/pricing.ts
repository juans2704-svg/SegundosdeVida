/**
 * Cálculo de montos de una donación. Lo usan el navegador (para mostrar) y el
 * servidor (para cobrar): el servidor nunca confía en un monto enviado por el
 * navegador, lo recalcula aquí a partir de la pieza elegida.
 */
import { pieces, type Piece } from '../config/campaign';
import { payments, regions, type Region } from '../config/payments';
import { copToUSD, usdToCOP, feeCover, formatMoney } from './format';
import t from '../i18n/es';

export type Frequency = 'once' | 'monthly';

export interface QuoteInput {
  region: Region;
  pieceId: string;
  frequency: Frequency;
  /** Monto libre en la moneda de la región (solo para la pieza "libre"). */
  custom?: number;
  coverFee: boolean;
}

export interface Quote {
  piece: Piece;
  currency: 'COP' | 'USD';
  provider: 'wompi' | 'paypal';
  /** Valor de la pieza en COP: es lo que suma al recaudo. */
  amountCOP: number;
  /** Valor de la pieza en la moneda que se cobra. */
  amount: number;
  /** Extra para cubrir la comisión (0 si no se eligió). */
  fee: number;
  /** amount + fee */
  total: number;
  /** total en centavos, como lo pide la pasarela. */
  totalInCents: number;
}

export function findPiece(id: string): Piece | undefined {
  return pieces.find((p) => p.id === id);
}

export function quote(input: QuoteInput): Quote | { error: string } {
  const piece = findPiece(input.pieceId);
  if (!piece) return { error: 'Pieza no válida.' };
  if (input.frequency === 'monthly' && piece.monthly === false) return { error: 'Esta pieza no se ofrece como aporte mensual.' };
  const region = regions[input.region];
  if (!region) return { error: 'Región no válida.' };
  const currency = region.currency;

  let amountCOP: number;
  let amount: number;
  if (piece.amount !== null) {
    amountCOP = piece.amount;
    amount = currency === 'COP' ? piece.amount : copToUSD(piece.amount);
  } else {
    const raw = Math.floor(Number(input.custom) || 0);
    if (!raw) return { error: t.donate.customEmpty };
    const min = payments.minAmount[currency];
    if (raw < min) return { error: t.donate.customMin(formatMoney(min, currency)) };
    if (raw > payments.maxAmount[currency]) return { error: t.donate.customMax };
    amount = raw;
    amountCOP = currency === 'COP' ? raw : usdToCOP(raw);
  }

  const fee = input.coverFee ? feeCover(amount, currency) : 0;
  const total = Math.round((amount + fee) * 100) / 100;
  return {
    piece,
    currency,
    provider: region.provider,
    amountCOP,
    amount,
    fee,
    total,
    totalInCents: Math.round(total * 100),
  };
}
