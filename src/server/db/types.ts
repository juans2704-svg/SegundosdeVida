export type DonationStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'error';
export type DonationSource = 'wompi' | 'paypal' | 'manual' | 'demo';
export type Frequency = 'once' | 'monthly';
export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'cancelled' | 'failed';

export interface Certificate {
  name: string;
  docType: string;
  docNumber: string;
}

export interface Donation {
  id: string;
  createdAt: string;
  updatedAt: string;
  reference: string;
  status: DonationStatus;
  source: DonationSource;
  frequency: Frequency;
  subscriptionId: string | null;
  pieceId: string;
  amountCOP: number;
  currency: string;
  chargeAmount: number;
  fee: number;
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  consent: boolean;
  showOnWall: boolean;
  certificate: Certificate | null;
  providerTransactionId: string | null;
  paymentMethod: string | null;
  statusMessage: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdBy: string | null;
}

export type NewDonation = Omit<
  Donation,
  'id' | 'createdAt' | 'updatedAt' | 'approvedAt' | 'providerTransactionId' | 'paymentMethod' | 'statusMessage'
> &
  Partial<Pick<Donation, 'approvedAt' | 'providerTransactionId' | 'paymentMethod' | 'statusMessage'>>;

export type DonationPatch = Partial<
  Pick<Donation, 'status' | 'providerTransactionId' | 'paymentMethod' | 'statusMessage' | 'approvedAt'>
>;

export interface Subscription {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SubscriptionStatus;
  provider: string;
  pieceId: string;
  currency: string;
  amountCOP: number;
  chargeAmount: number;
  fee: number;
  donorName: string | null;
  donorEmail: string;
  donorPhone: string | null;
  consent: boolean;
  showOnWall: boolean;
  certificate: Certificate | null;
  paymentSourceId: string | null;
  paymentMethod: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  /** YYYY-MM-DD */
  nextChargeOn: string | null;
  failedAttempts: number;
  lastError: string | null;
  cancelToken: string;
  cancelledAt: string | null;
}

export type NewSubscription = Pick<
  Subscription,
  | 'provider'
  | 'pieceId'
  | 'currency'
  | 'amountCOP'
  | 'chargeAmount'
  | 'fee'
  | 'donorName'
  | 'donorEmail'
  | 'donorPhone'
  | 'consent'
  | 'showOnWall'
  | 'certificate'
>;

export type SubscriptionPatch = Partial<
  Pick<
    Subscription,
    | 'status'
    | 'paymentSourceId'
    | 'paymentMethod'
    | 'cardBrand'
    | 'cardLast4'
    | 'nextChargeOn'
    | 'failedAttempts'
    | 'lastError'
    | 'cancelledAt'
  >
>;

export interface PaymentEvent {
  provider: string;
  event: string | null;
  reference: string | null;
  signatureValid: boolean;
  payload: unknown;
}

export interface Stats {
  raisedCOP: number;
  heroes: number;
  approvedDonations: number;
  activeSubscriptions: number;
  monthlyCOP: number;
}

export interface Store {
  readonly kind: 'postgres' | 'memory';
  insertDonation(d: NewDonation): Promise<Donation>;
  getDonation(reference: string): Promise<Donation | null>;
  /** Actualiza solo si el estado actual está en `from` (evita procesar dos veces el mismo pago). */
  transitionDonation(reference: string, from: DonationStatus[], patch: DonationPatch): Promise<Donation | null>;
  subscriptionCharges(subscriptionId: string, referencePrefix: string): Promise<Donation[]>;
  listDonations(limit: number): Promise<Donation[]>;
  progress(): Promise<{ raisedCOP: number; heroes: number }>;
  wall(limit: number): Promise<{ name: string | null; pieceId: string }[]>;

  insertSubscription(s: NewSubscription): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | null>;
  getSubscriptionByCancelToken(token: string): Promise<Subscription | null>;
  updateSubscription(id: string, patch: SubscriptionPatch): Promise<Subscription | null>;
  dueSubscriptions(today: string): Promise<Subscription[]>;
  listSubscriptions(limit: number): Promise<Subscription[]>;

  logEvent(e: PaymentEvent): Promise<void>;
  stats(): Promise<Stats>;
}
