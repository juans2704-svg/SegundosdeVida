export type Frequency = 'once' | 'monthly';
export type PaymentStatus = 'approved' | 'pending' | 'declined' | 'error' | 'cancelled';

export interface DonationOrder {
  /** SC-{timestamp}-{monto} (brief §7.3) */
  reference: string;
  amountCOP: number;
  /** Valor de la pieza en la moneda del proveedor. */
  amount: number;
  /** Extra para cubrir la comisión de la pasarela (0 si no se eligió). Se cobra amount + fee. */
  fee: number;
  currency: 'COP' | 'USD';
  frequency: Frequency;
  pieceId: string;
  donor: {
    name: string;
    email: string;
    phone: string;
    consent: boolean;
    showOnWall: boolean;
  };
  /** Datos para el certificado de donación, si se pidió. */
  certificate?: { name: string; docType: string; docNumber: string };
}

export interface PaymentResult {
  status: PaymentStatus;
  transactionId?: string;
}

export interface PaymentProvider {
  id: 'wompi' | 'paypal' | 'demo';
  label: string;
  methods: string;
  pay(order: DonationOrder): Promise<PaymentResult>;
}
