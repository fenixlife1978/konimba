'use client';
import type { Payment } from '@/lib/definitions';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { DataTable } from '@/app/(dashboard)/payments/components/data-table';
import { columns } from '@/app/(dashboard)/payments/components/columns';

export default function ReportsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const paymentsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'publishers', user.uid, 'payments')) : null, [firestore, user]);
  const { data: payments, isLoading } = useCollection<Payment>(paymentsQuery);

  if (isLoading) {
    return <div>Cargando informes...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Informe de Pagos</h1>
      </div>
      <DataTable searchKey="publisherName" columns={columns} data={payments || []} />
    </div>
  );
}
