import { Timestamp } from "firebase/firestore";

export type Publisher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentMethod: 'PAYPAL' | 'BINANCE' | 'BOLIVARES' | 'PESOS COLOMBIANOS';
  paymentDetails: string; // For PAYPAL (email) or BINANCE (wallet)
  country?: 'Venezuela' | 'Colombia';
  bankName?: string;
  accountNumber?: string;
  accountType?: 'Ahorro' | 'Corriente';
  accountHolderName?: string;
  accountHolderId?: string;
  createdAt: Timestamp | Date;
  avatarUrl?: string; 
  status?: 'Activo' | 'Inactivo'; 
};

export type Offer = {
  id: string;
  name: string;
  payout: number;
  currency: string;
  publisherId: string;
  status: 'Activa' | 'Pausada' | 'Eliminada';
};

export type GlobalOffer = {
  id: string;
  name: string;
  payout: number;
  currency: string;
  status: 'Activa' | 'Pausada' | 'Eliminada';
};

export type Lead = {
  id: string;
  publisherId: string;
  offerId: string;
  date: Timestamp | Date | string;
  count: number;
  publisherName?: string;
  offerName?: string;
};


export type Payment = {
  id: string;
  publisherId: string;
  amount: number;
  currency: 'USD';
  paymentDate: Timestamp | Date;
  paymentMethod: 'PAYPAL' | 'BINANCE' | 'BOLIVARES' | 'PESOS COLOMBIANOS';
  receiptId?: string;
  notes?: string;
  // For UI display, not in Firestore schema directly
  publisherName?: string;
  publisherAvatarUrl?: string;
  status: 'Pagado' | 'Pendiente' | 'Fallido';
  receiptUrl?: string;
  isPotentiallyFraudulent?: boolean;
  fraudulentReason?: string;
  exchangeRate?: number;
  finalAmount?: number;
  finalCurrency?: 'VES' | 'COP';
};

export type HistoricalPayment = {
  paymentAmount: number;
  paymentCurrency: 'USD';
  paymentDate: string | Date; // Allow Date object
};

export type PaymentWithHistory = Payment & {
  historicalPaymentData?: HistoricalPayment[];
};

export type Receipt = {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadDate: Timestamp;
  filePath: string;
};
