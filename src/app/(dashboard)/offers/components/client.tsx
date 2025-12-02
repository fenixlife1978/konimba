'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Offer } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';

interface OfferClientProps {
  data: Offer[];
}

export const OfferClient: React.FC<OfferClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div/>
        <Button onClick={() => alert('¡Agregar nueva oferta!')}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Nueva
        </Button>
      </div>
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};
