'use client';
import type { Payment, PaymentWithHistory } from '@/lib/definitions';
import { PaymentClient } from '@/app/(dashboard)/payments/components/client';
import { flagPotentiallyFraudulentPayments } from '@/ai/flows/flag-potentially-fraudulent-payments';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const [paymentsWithFraudCheck, setPaymentsWithFraudCheck] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: publishers } = useCollection(firestore ? collection(firestore, 'publishers') : null);

  useEffect(() => {
    if (firestore && publishers) {
      const fetchAllPayments = async () => {
        setIsLoading(true);
        const allPayments: PaymentWithHistory[] = [];

        for (const publisher of publishers) {
          const paymentsRef = collection(firestore, 'publishers', publisher.id, 'payments');
          const paymentsSnapshot = await getDocs(paymentsRef);
          
          paymentsSnapshot.forEach(doc => {
            const paymentData = doc.data() as Payment;
            allPayments.push({
              ...paymentData,
              id: doc.id,
              publisherName: publisher.name, 
              publisherAvatarUrl: publisher.avatarUrl 
            });
          });
        }
        
        // Now that we have all payments, run fraud checks
        const checkedPayments = await Promise.all(
          allPayments.map(async (payment) => {
            // This part can be optimized if historical data isn't readily available per payment
            // For now, assuming it might be needed. If not, this can be simplified.
            const historicalData = payment.historicalPaymentData?.map(p => ({...p, paymentDate: format(new Date(p.paymentDate), 'yyyy-MM-dd')})) || [];
            
            const fraudCheckResult = await flagPotentiallyFraudulentPayments({
              publisherId: payment.publisherId,
              paymentAmount: payment.amount,
              paymentCurrency: payment.currency,
              paymentDate: format(new Date(payment.paymentDate as any), 'yyyy-MM-dd'),
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
        setIsLoading(false);
      };

      fetchAllPayments();
    }
  }, [firestore, publishers]);

  if (isLoading) {
    return <div>Cargando todos los pagos...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Pagos (Global)</h1>
      <PaymentClient data={paymentsWithFraudCheck} />
    </div>
  );
}
