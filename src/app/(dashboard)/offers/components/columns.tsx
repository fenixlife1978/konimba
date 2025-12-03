'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import type { Offer } from '@/lib/definitions';

export const columns: ColumnDef<Offer>[] = [
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
];
