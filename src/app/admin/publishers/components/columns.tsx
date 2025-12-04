'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import type { Publisher } from '@/lib/definitions';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { PublisherForm } from './publisher-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

const DeleteConfirmationDialog = ({ publisher, onConfirm }: { publisher: Publisher, onConfirm: () => void }) => {
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
            Esta acción no se puede deshacer. Esto eliminará permanentemente al editor
            <span className="font-semibold"> {publisher.name}</span>.
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


export const columns: ColumnDef<Publisher>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Editor',
    cell: ({ row }) => {
      const { name, email, avatarUrl } = row.original;
      const initials = name ? name.split(' ').map(n => n[0]).join('') : '';
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={status === 'Activo' ? 'secondary' : 'outline'} className={status === 'Activo' ? 'text-green-700 bg-green-100' : ''}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método de Pago',
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha de Ingreso',
    cell: ({ row }) => {
      const date = row.original.createdAt;
      // Firestore timestamps can be objects, so we need to convert them
      const jsDate = date && typeof date.toDate === 'function' ? date.toDate() : new Date(date);
      try {
        return format(jsDate, 'dd/MM/yyyy');
      } catch (e) {
        return 'Fecha inválida';
      }
    }
  },
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const [dialogOpen, setDialogOpen] = useState(false);
      const publisher = row.original;
      const firestore = useFirestore();

      const handleDelete = async () => {
        try {
          if (!firestore) return;
          const publisherRef = doc(firestore, 'publishers', publisher.id);
          await deleteDoc(publisherRef);
          toast({
            title: 'Editor Eliminado',
            description: `El editor "${publisher.name}" ha sido eliminado.`,
          });
        } catch (error) {
          console.error('Error deleting publisher:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el editor.',
          });
        }
      };

      return (
        <div className="text-right">
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
                    <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(publisher.id)}
                    >
                    Copiar ID del editor
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DialogTrigger asChild>
                      <DropdownMenuItem>Editar editor</DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuItem
                      className="text-destructive"
                      asChild
                    >
                      <DeleteConfirmationDialog publisher={publisher} onConfirm={handleDelete} />
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Editor</DialogTitle>
                </DialogHeader>
                <PublisherForm 
                  initialData={publisher} 
                  onSuccess={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
        </div>
      );
    },
  },
];
