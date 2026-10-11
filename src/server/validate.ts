import type { Certificate } from './db/types';
import type { Region } from '../config/payments';
import type { Frequency } from '../lib/pricing';

export interface DonorInput {
  name: string | null;
  email: string;
  phone: string | null;
  consent: true;
  showOnWall: boolean;
  certificate: Certificate | null;
}

export interface OrderInput {
  region: Region;
  pieceId: string;
  frequency: Frequency;
  custom?: number;
  coverFee: boolean;
  donor: DonorInput;
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const DOC_TYPES = new Set(['CC', 'NIT', 'CE', 'PA']);

const clean = (v: unknown, max: number) => {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  return s ? s.slice(0, max) : null;
};

export class ValidationError extends Error {
  status = 400;
}

/** Valida y normaliza lo que envía el navegador. Lanza ValidationError con un mensaje para la persona. */
export function parseOrder(body: unknown): OrderInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const d = (b.donor ?? {}) as Record<string, unknown>;

  const region = b.region === 'intl' ? 'intl' : b.region === 'co' ? 'co' : null;
  if (!region) throw new ValidationError('Región no válida.');
  const frequency = b.frequency === 'monthly' ? 'monthly' : b.frequency === 'once' ? 'once' : null;
  if (!frequency) throw new ValidationError('Frecuencia no válida.');
  const pieceId = clean(b.pieceId, 30);
  if (!pieceId) throw new ValidationError('Elige una pieza.');

  const email = clean(d.email, 254)?.toLowerCase() ?? '';
  if (!EMAIL.test(email)) throw new ValidationError('Revisa tu correo, parece que le falta algo 💛');
  if (d.consent !== true) throw new ValidationError('Necesitamos tu autorización para registrar tu aporte.');

  const phone = clean(d.phone, 20);
  if (phone && !/^[+\d\s()-]{7,20}$/.test(phone)) throw new ValidationError('Revisa tu número de WhatsApp.');

  let certificate: Certificate | null = null;
  if (d.certificate && typeof d.certificate === 'object') {
    const c = d.certificate as Record<string, unknown>;
    const docType = String(c.docType ?? '');
    const docNumber = clean(c.docNumber, 20) ?? '';
    if (!DOC_TYPES.has(docType)) throw new ValidationError('Tipo de documento no válido.');
    if (!/^[0-9A-Za-z.\-]{4,20}$/.test(docNumber)) throw new ValidationError('Escribe el número de documento para tu certificado.');
    certificate = { name: clean(c.name, 100) ?? clean(d.name, 60) ?? '', docType, docNumber };
  }

  return {
    region,
    pieceId,
    frequency,
    custom: b.custom === undefined || b.custom === null ? undefined : Number(b.custom),
    coverFee: b.coverFee === true,
    donor: {
      name: clean(d.name, 60),
      email,
      phone,
      consent: true,
      showOnWall: d.showOnWall === true,
      certificate,
    },
  };
}
