'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { Lead, GlobalOffer, Publisher } from '@/lib/definitions';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { LeadForm } from './lead-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { format } from 'date-fns';

interface ColumnsProps {
  publishers: Publisher[];
  offers: GlobalOffer[];
}

const DeleteConfirmationDialog = ({ lead, onConfirm }: { lead: Lead, onConfirm: () => void }) => {
  const date = lead.date as any;
  const jsDate = date?.toDate ? date.toDate() : new Date(date);
  const formattedDate = format(jsDate, 'dd/MM/yyyy');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
          Eliminar
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de leads del editor 
            <span className="font-semibold"> {lead.publisherName}</span> para la oferta <span className="font-semibold">{lead.offerName}</span> del día <span className="font-semibold">{formattedDate}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export const columns = ({ publishers, offers }: ColumnsProps): ColumnDef<Lead>[] => [
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => {
        const date = row.original.date as any;
        const jsDate = date?.toDate ? date.toDate() : new Date(date);
        return format(jsDate, 'dd/MM/yyyy');
    },
  },
  {
    accessorKey: 'publisherName',
    header: 'Editor',
  },
  {
    accessorKey: 'offerName',
    header: 'Oferta',
  },
  {
    accessorKey: 'count',
    header: 'Cantidad de Leads',
    cell: ({ row }) => {
      const count = parseInt(row.getValue('count'), 10);
      return <div className="font-medium text-center">{count}</div>;
    },
  },
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const [dialogOpen, setDialogOpen] = useState(false);
      const lead = row.original;
      const firestore = useFirestore();

      const handleDelete = async () => {
        try {
          if (!firestore) return;
          const leadRef = doc(firestore, 'leads', lead.id);
          await deleteDoc(leadRef);
          toast({
            title: 'Registro Eliminado',
            description: `El registro de leads ha sido eliminado.`,
          });
        } catch (error) {
          console.error('Error deleting lead:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el registro.',
          });
        }
      };

      return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  Modificar
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem
                className="text-destructive"
                asChild
              >
                <DeleteConfirmationDialog lead={lead} onConfirm={handleDelete} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Leads</DialogTitle>
            </DialogHeader>
            <LeadForm 
              initialData={lead} 
              publishers={publishers}
              offers={offers}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
