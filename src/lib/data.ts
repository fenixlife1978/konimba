import type { Publisher, Offer, PaymentWithHistory } from './definitions';

export const publishers: Publisher[] = [
  { id: 'pub_1', name: 'Alpha Media', email: 'contact@alphamedia.com', avatarUrl: 'https://picsum.photos/seed/1/40/40', paymentMethod: 'PayPal', status: 'Activo', joiningDate: '2023-01-15' },
  { id: 'pub_2', name: 'Beta Digital', email: 'accounts@betadigital.com', avatarUrl: 'https://picsum.photos/seed/2/40/40', paymentMethod: 'Transferencia Bancaria', status: 'Activo', joiningDate: '2023-02-20' },
  { id: 'pub_3', name: 'Gamma Group', email: 'info@gammagroup.com', avatarUrl: 'https://picsum.photos/seed/3/40/40', paymentMethod: 'Payoneer', status: 'Inactivo', joiningDate: '2022-11-05' },
  { id: 'pub_4', name: 'Delta Solutions', email: 'support@deltasols.com', avatarUrl: 'https://picsum.photos/seed/4/40/40', paymentMethod: 'PayPal', status: 'Activo', joiningDate: '2023-05-10' },
  { id: 'pub_5', name: 'Epsilon Ads', email: 'admin@epsilonads.com', avatarUrl: 'https://picsum.photos/seed/5/40/40', paymentMethod: 'Transferencia Bancaria', status: 'Activo', joiningDate: '2023-03-22' },
];

export const offers: Offer[] = [
  { id: 'offer_1', name: 'Campaña de Venta de Verano', platform: 'AdPlatform X', payout: 500, status: 'Activa', startDate: '2023-06-01' },
  { id: 'offer_2', name: 'Bonanza Q4', platform: 'AdPlatform Y', payout: 750, status: 'Activa', startDate: '2023-10-01' },
  { id: 'offer_3', name: 'Aventura de Primavera', platform: 'AdPlatform X', payout: 400, status: 'Pausada', startDate: '2023-04-01' },
  { id: 'offer_4', name: 'Explosión de Año Nuevo', platform: 'AdPlatform Z', payout: 1200, status: 'Expirada', startDate: '2023-01-01' },
  { id: 'offer_5', name: 'Especial de Vacaciones', platform: 'AdPlatform Y', payout: 950, status: 'Activa', startDate: '2023-11-15' },
];

const allPayments: PaymentWithHistory[] = [
  {
    id: 'pay_1',
    publisherId: 'pub_1',
    publisherName: 'Alpha Media',
    publisherAvatarUrl: 'https://picsum.photos/seed/1/40/40',
    amount: 1250.00,
    currency: 'USD',
    date: '2024-05-28',
    status: 'Pagado',
    receiptUrl: 'https://picsum.photos/seed/r1/600/800',
    historicalPaymentData: [
      { paymentAmount: 1100, paymentCurrency: 'USD', paymentDate: '2024-04-28' },
      { paymentAmount: 1150, paymentCurrency: 'USD', paymentDate: '2024-03-28' },
    ]
  },
  {
    id: 'pay_2',
    publisherId: 'pub_2',
    publisherName: 'Beta Digital',
    publisherAvatarUrl: 'https://picsum.photos/seed/2/40/40',
    amount: 3200.50,
    currency: 'USD',
    date: '2024-05-28',
    status: 'Pendiente',
    historicalPaymentData: [
      { paymentAmount: 3000, paymentCurrency: 'USD', paymentDate: '2024-04-28' },
      { paymentAmount: 3100, paymentCurrency: 'USD', paymentDate: '2024-03-28' },
    ]
  },
  {
    id: 'pay_3',
    publisherId: 'pub_4',
    publisherName: 'Delta Solutions',
    publisherAvatarUrl: 'https://picsum.photos/seed/4/40/40',
    amount: 8000.00, // Potential fraud (high amount)
    currency: 'USD',
    date: '2024-05-29',
    status: 'Pendiente',
    historicalPaymentData: [
      { paymentAmount: 750, paymentCurrency: 'USD', paymentDate: '2024-04-29' },
      { paymentAmount: 800, paymentCurrency: 'USD', paymentDate: '2024-03-29' },
    ]
  },
  {
    id: 'pay_4',
    publisherId: 'pub_5',
    publisherName: 'Epsilon Ads',
    publisherAvatarUrl: 'https://picsum.photos/seed/5/40/40',
    amount: 2100.75,
    currency: 'USD',
    date: '2024-05-30',
    status: 'Pagado',
    receiptUrl: 'https://picsum.photos/seed/r2/600/800',
    historicalPaymentData: [
      { paymentAmount: 2050, paymentCurrency: 'USD', paymentDate: '2024-04-30' },
      { paymentAmount: 2000, paymentCurrency: 'USD', paymentDate: '2024-03-30' },
    ]
  },
  {
    id: 'pay_5',
    publisherId: 'pub_1',
    publisherName: 'Alpha Media',
    publisherAvatarUrl: 'https://picsum.photos/seed/1/40/40',
    amount: 50.00, // Potential fraud (low amount, unusual)
    currency: 'USD',
    date: '2024-05-15',
    status: 'Fallido',
    historicalPaymentData: [
      { paymentAmount: 1250, paymentCurrency: 'USD', paymentDate: '2024-05-28' },
      { paymentAmount: 1100, paymentCurrency: 'USD', paymentDate: '2024-04-28' },
    ]
  },
  {
    id: 'pay_6',
    publisherId: 'pub_2',
    publisherName: 'Beta Digital',
    publisherAvatarUrl: 'https://picsum.photos/seed/2/40/40',
    amount: 3250.00,
    currency: 'USD',
    date: '2024-04-28',
    status: 'Pagado',
    receiptUrl: 'https://picsum.photos/seed/r3/600/800',
    historicalPaymentData: [
      { paymentAmount: 3000, paymentCurrency: 'USD', paymentDate: '2024-03-28' },
      { paymentAmount: 3100, paymentCurrency: 'USD', paymentDate: '2024-02-28' },
    ]
  },
];

export const payments: PaymentWithHistory[] = allPayments;

export const user = {
  name: 'Usuario Administrador',
  email: 'admin@konimba.com',
  avatarUrl: 'https://picsum.photos/seed/user/40/40',
};
