export type Publisher = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  paymentMethod: 'PayPal' | 'Bank Transfer' | 'Payoneer';
  status: 'Active' | 'Inactive';
  joiningDate: string;
};

export type Offer = {
  id: string;
  name: string;
  platform: string;
  payout: number;
  status: 'Live' | 'Paused' | 'Expired';
  startDate: string;
};

export type Payment = {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherAvatarUrl: string;
  amount: number;
  currency: 'USD';
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  receiptUrl?: string;
  isPotentiallyFraudulent?: boolean;
  fraudulentReason?: string;
};

export type HistoricalPayment = {
  paymentAmount: number;
  paymentCurrency: 'USD';
  paymentDate: string;
};

export type PaymentWithHistory = Payment & {
  historicalPaymentData: HistoricalPayment[];
};
