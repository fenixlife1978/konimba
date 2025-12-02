'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Publisher } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';

interface PublisherClientProps {
  data: Publisher[];
}

export const PublisherClient: React.FC<PublisherClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div/>
        <Button onClick={() => alert('¡Agregar nuevo editor!')}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Nuevo
        </Button>
      </div>
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};
