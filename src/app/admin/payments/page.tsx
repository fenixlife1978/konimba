'use client';
import type { Payment } from '@/lib/definitions';
import { PaymentClient } from './components/client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();

  // Query all payments from the top-level 'payments' collection
  const paymentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
  const { data: payments, isLoading } = useCollection<Payment>(paymentsRef);

  if (isLoading) {
    return <div>Cargando pagos...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Gestión de Pagos (Global)</h1>
      <PaymentClient data={payments || []} />
    </div>
  );
}
