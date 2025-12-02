'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Payment } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';

interface PaymentClientProps {
  data: Payment[];
}

export const PaymentClient: React.FC<PaymentClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div/>
        <Button onClick={() => alert('¡Agregar nuevo pago!')}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Nuevo
        </Button>
      </div>
      <DataTable searchKey="publisherName" columns={columns} data={data} />
    </>
  );
};
