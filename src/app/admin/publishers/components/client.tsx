'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Publisher } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PublisherForm } from './publisher-form';
import { useState } from 'react';

interface PublisherClientProps {
  data: Publisher[];
}

export const PublisherClient: React.FC<PublisherClientProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between mb-4">
          <div />
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Agregar Nuevo Editor
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Editor</DialogTitle>
          </DialogHeader>
          <PublisherForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};
