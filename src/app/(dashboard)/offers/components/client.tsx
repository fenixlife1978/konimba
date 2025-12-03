'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Offer, Publisher } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OfferForm } from './offer-form';
import { useState } from 'react';

interface OfferClientProps {
  data: Offer[];
  publisherId?: string;
  publishers?: Publisher[];
}

export const OfferClient: React.FC<OfferClientProps> = ({
  data,
  publisherId,
  publishers,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between mb-4">
          <div />
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Agregar Nueva
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Oferta</DialogTitle>
          </DialogHeader>
          <OfferForm
            publishers={publishers}
            publisherId={publisherId}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <DataTable
        searchKey="name"
        columns={columns({ publishers })}
        data={data}
      />
    </>
  );
};
