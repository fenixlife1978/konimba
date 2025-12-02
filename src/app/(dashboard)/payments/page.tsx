import { payments } from '@/lib/data';
import type { Payment } from '@/lib/definitions';
import { PaymentClient } from './components/client';
import { flagPotentiallyFraudulentPayments } from '@/ai/flows/flag-potentially-fraudulent-payments';

export default async function PaymentsPage() {

  const paymentsWithFraudCheck = await Promise.all(
    payments.map(async (payment) => {
      const fraudCheckResult = await flagPotentiallyFraudulentPayments({
        publisherId: payment.publisherId,
        paymentAmount: payment.amount,
        paymentCurrency: payment.currency,
        paymentDate: payment.date,
        historicalPaymentData: payment.historicalPaymentData,
      });

      return {
        ...payment,
        isPotentiallyFraudulent: fraudCheckResult.isPotentiallyFraudulent,
        fraudulentReason: fraudCheckResult.fraudulentReason,
      };
    })
  );

  const formattedPayments: Payment[] = paymentsWithFraudCheck.map(item => ({
    id: item.id,
    publisherId: item.publisherId,
    publisherName: item.publisherName,
    publisherAvatarUrl: item.publisherAvatarUrl,
    amount: item.amount,
    currency: item.currency,
    date: item.date,
    status: item.status,
    receiptUrl: item.receiptUrl,
    isPotentiallyFraudulent: item.isPotentiallyFraudulent,
    fraudulentReason: item.fraudulentReason,
  }));
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Pagos</h1>
      <PaymentClient data={formattedPayments} />
    </div>
  );
}
