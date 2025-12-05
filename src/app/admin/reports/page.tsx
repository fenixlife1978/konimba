'use client';
import type { Payment } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { DataTable } from '@/app/admin/payments/components/data-table';
import { columns } from '@/app/admin/payments/components/columns';
import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  const firestore = useFirestore();
  const paymentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
  const { data: payments, isLoading } = useCollection<Payment>(paymentsRef);

  if (isLoading) {
    return <div>Cargando informe de pagos...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Reporte de Pagos Detallado</h1>
        <Button onClick={() => alert('¡Funcionalidad en desarrollo!')}>
          Exportar Reporte
        </Button>
      </div>
      <p className="text-muted-foreground">
        Aquí puedes ver un informe consolidado de todos los pagos generados en el sistema.
      </p>
      <DataTable searchKey="publisherName" columns={columns} data={payments || []} />
    </div>
  );
}
