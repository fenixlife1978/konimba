'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Offer } from '@/lib/definitions';
import { Checkbox } from '@/components/ui/checkbox';

export const columns: ColumnDef<Offer>[] = [
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
    header: 'Nombre de la Oferta',
  },
  {
    accessorKey: 'platform',
    header: 'Plataforma',
  },
  {
    accessorKey: 'payout',
    header: 'Pago',
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
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = {
        Live: 'secondary',
        Paused: 'outline',
        Expired: 'destructive',
      }[status] as 'secondary' | 'outline' | 'destructive';
      const colorClass = {
        Live: 'text-green-700 bg-green-100',
        Paused: 'text-amber-700 bg-amber-100',
        Expired: 'text-red-700 bg-red-100',
      }[status];

      return <Badge variant={variant} className={colorClass}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Fecha de Inicio',
    cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString('es-ES'),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => alert(`Editando ${offer.name}`)}>
                Editar Oferta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert(`Pausando ${offer.name}`)}>
                Pausar Oferta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
