'use client';
import type { Payment, Publisher } from '@/lib/definitions';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { DataTable } from '@/app/admin/payments/components/data-table';
import { columns } from '@/app/admin/payments/components/columns';


export default function ReportsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  // Create a query for payments belonging to the current user
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'payments'), where('publisherId', '==', user.uid));
  }, [firestore, user]);

  const { data: payments, isLoading } = useCollection<Payment>(paymentsQuery);
  
  const publishersRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'publishers'), where('id', '==', user.uid));
  }, [firestore, user]);
  const { data: publishers } = useCollection<Publisher>(publishersRef);

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

  if (isLoading) {
    return <div>Cargando informes...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Informe de Pagos</h1>
      </div>
      <DataTable searchKey="publisherName" columns={columns} data={enrichedPayments || []} />
    </div>
  );
}
