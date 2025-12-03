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
import { Badge } from '@/components/ui/badge';
import type { Offer, Publisher } from '@/lib/definitions';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { OfferForm } from './offer-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

interface ColumnsProps {
  publishers?: Publisher[];
}

const DeleteConfirmationDialog = ({ offer, onConfirm }: { offer: Offer, onConfirm: () => void }) => {
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
            Esta acción no se puede deshacer. Esto eliminará permanentemente la oferta
            <span className="font-semibold"> {offer.name}</span>.
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


export const columns = ({ publishers }: ColumnsProps): ColumnDef<Offer>[] => [
  {
    accessorKey: 'name',
    header: 'Nombre de la Oferta',
  },
  {
    accessorKey: 'payout',
    header: 'Pago por Unidad',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('payout'));
      const formatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = {
        Activa: 'secondary',
        Pausada: 'outline',
        Eliminada: 'destructive',
      }[status] as 'secondary' | 'outline' | 'destructive';
      const colorClass = {
        Activa: 'text-green-700 bg-green-100',
        Pausada: 'text-amber-700 bg-amber-100',
        Eliminada: 'text-red-700 bg-red-100',
      }[status];

      return <Badge variant={variant} className={colorClass}>{status}</Badge>;
    },
  },
  ...(publishers
    ? [
        {
          accessorKey: 'publisherId',
          header: 'Editor',
          cell: ({ row }: { row: any }) => {
            const publisher = publishers.find(
              (p) => p.id === row.original.publisherId
            );
            return publisher ? publisher.name : 'Desconocido';
          },
        },
      ]
    : []),
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const [dialogOpen, setDialogOpen] = useState(false);
      const offer = row.original;
      const firestore = useFirestore();

      const handleDelete = async () => {
        try {
          const offerRef = doc(
            firestore,
            'publishers',
            offer.publisherId,
            'offers',
            offer.id
          );
          await deleteDoc(offerRef);
          toast({
            title: 'Oferta Eliminada',
            description: `La oferta "${offer.name}" ha sido eliminada.`,
          });
        } catch (error) {
          console.error('Error deleting offer:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar la oferta.',
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
                <DeleteConfirmationDialog offer={offer} onConfirm={handleDelete} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Oferta</DialogTitle>
            </DialogHeader>
            <OfferForm 
              initialData={offer} 
              publishers={publishers}
              publisherId={offer.publisherId}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
