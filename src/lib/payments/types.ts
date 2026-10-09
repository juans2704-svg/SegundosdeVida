export type Frequency = 'once' | 'monthly';
export type PaymentStatus = 'approved' | 'pending' | 'declined' | 'error' | 'cancelled';

export interface DonationOrder {
  /** SC-{timestamp}-{monto} (brief §7.3) */
  reference: string;
  amountCOP: number;
  /** Monto que se cobra en la moneda del proveedor. */
  amount: number;
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
