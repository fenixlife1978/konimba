'use client';
import type { Payment, PaymentWithHistory } from '@/lib/definitions';
import { PaymentClient } from './components/client';
import { flagPotentiallyFraudulentPayments } from '@/ai/flows/flag-potentially-fraudulent-payments';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const paymentsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'publishers', user.uid, 'payments')) : null, [firestore, user]);
  const { data: payments, isLoading } = useCollection<PaymentWithHistory>(paymentsQuery);
  const [paymentsWithFraudCheck, setPaymentsWithFraudCheck] = useState<Payment[]>([]);

  useEffect(() => {
    if (payments) {
      const processPayments = async () => {
        const checkedPayments = await Promise.all(
          payments.map(async (payment) => {
            const historicalData = payment.historicalPaymentData?.map(p => ({...p, paymentDate: format(new Date(p.paymentDate), 'yyyy-MM-dd')})) || [];
            
            const fraudCheckResult = await flagPotentiallyFraudulentPayments({
              publisherId: payment.publisherId,
              paymentAmount: payment.amount,
              paymentCurrency: payment.currency,
              paymentDate: format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
              historicalPaymentData: historicalData,
            });

            return {
              ...payment,
              isPotentiallyFraudulent: fraudCheckResult.isPotentiallyFraudulent,
              fraudulentReason: fraudCheckResult.fraudulentReason,
            };
          })
        );
        setPaymentsWithFraudCheck(checkedPayments);
      };

      processPayments();
    }
  }, [payments]);

  if (isLoading) {
    return <div>Cargando pagos...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Pagos</h1>
      <PaymentClient data={paymentsWithFraudCheck} />
    </div>
  );
}
