// This is a new file
'use client';
import type { Payment } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';

interface PaymentClientProps {
  data: Payment[];
}

export const PaymentClient: React.FC<PaymentClientProps> = ({ data }) => {
  return (
    <>
       <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Aquí puedes revisar y procesar todos los pagos pendientes generados.
        </p>
        <Button onClick={() => alert('¡Funcionalidad en desarrollo!')}>
          Exportar Pagos
        </Button>
      </div>
      <DataTable searchKey="publisherName" columns={columns} data={data} />
    </>
  );
};
