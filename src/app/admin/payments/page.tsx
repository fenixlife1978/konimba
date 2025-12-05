'use client';
import type { Payment, Publisher } from '@/lib/definitions';
import { PaymentClient } from './components/client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useMemo } from 'react';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();

  // Query all payments from the top-level 'payments' collection
  const paymentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
  const { data: payments, isLoading: paymentsLoading } = useCollection<Payment>(paymentsRef);
  
  const publishersRef = useMemoFirebase(() => firestore ? collection(firestore, 'publishers') : null, [firestore]);
  const { data: publishers, isLoading: publishersLoading } = useCollection<Publisher>(publishersRef);

  const enrichedPayments = useMemo(() => {
    if (!payments || !publishers) return [];
    return payments.map(payment => {
      const publisher = publishers.find(p => p.id === payment.publisherId);
      return {
        ...payment,
        publisherName: publisher?.name || payment.publisherName || 'Desconocido',
        publisherAvatarUrl: publisher?.avatarUrl || payment.publisherAvatarUrl || '',
      };
    });
  }, [payments, publishers]);

  const isLoading = paymentsLoading || publishersLoading;

  if (isLoading) {
    return <div>Cargando pagos...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Gestión de Pagos (Global)</h1>
      <PaymentClient data={enrichedPayments || []} />
    </div>
  );
}
