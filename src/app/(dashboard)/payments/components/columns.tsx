'use client';

import Image from 'next/image';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ShieldAlert, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

export const columns: ColumnDef<Payment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'publisherName',
    header: 'Publisher',
    cell: ({ row }) => {
      const { publisherName, publisherAvatarUrl } = row.original;
      const initials = publisherName.split(' ').map(n => n[0]).join('');
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={publisherAvatarUrl} alt={publisherName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{publisherName}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
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
      const { status, isPotentiallyFraudulent, fraudulentReason } = row.original;
      const badgeVariant = {
        Paid: 'secondary',
        Pending: 'outline',
        Failed: 'destructive',
      }[status] as 'secondary' | 'outline' | 'destructive';
      const colorClass = {
        Paid: 'text-green-700 bg-green-100',
        Pending: 'text-amber-700 bg-amber-100',
        Failed: 'text-red-700 bg-red-100',
      }[status];

      return (
        <div className="flex items-center gap-2">
            <Badge variant={badgeVariant} className={colorClass}>{status}</Badge>
            {isPotentiallyFraudulent && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">{fraudulentReason}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
  {
    id: 'receipt',
    header: 'Receipt',
    cell: ({ row }) => {
        const { receiptUrl, id } = row.original;
        if (!receiptUrl) return <span className="text-muted-foreground">N/A</span>;

        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Receipt for Payment {id}</DialogTitle>
                    </DialogHeader>
                    <div className="relative mt-4 h-[70vh] w-full">
                      <Image src={receiptUrl} alt={`Receipt for ${id}`} layout="fill" objectFit="contain" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => alert(`Marking ${payment.id} as paid`)}>
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem>View Publisher</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
