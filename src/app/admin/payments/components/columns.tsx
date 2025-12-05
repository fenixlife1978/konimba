'use client';

import Image from 'next/image';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ShieldAlert, Receipt, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const exchangeRateSchema = z.object({
  rate: z.coerce.number().positive('La tasa debe ser un número positivo.'),
});

const MarkAsPaidModal = ({ payment, onConfirm }: { payment: Payment, onConfirm: (rate?: number) => void }) => {
    const [open, setOpen] = useState(false);
    const requiresRate = payment.paymentMethod === 'BOLIVARES' || payment.paymentMethod === 'PESOS COLOMBIANOS';

    const form = useForm<z.infer<typeof exchangeRateSchema>>({
        resolver: zodResolver(exchangeRateSchema),
        defaultValues: { rate: '' as any },
    });

    const onSubmit = (data: z.infer<typeof exchangeRateSchema>) => {
        onConfirm(data.rate);
        setOpen(false);
        form.reset();
    };

    const handleSimpleConfirm = () => {
        onConfirm();
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Marcar como Pagado</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Pago</DialogTitle>
                    <DialogDescription>
                        Estás a punto de marcar este pago como "Pagado". Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                {requiresRate ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <p className="text-sm">
                                El monto original es <strong>${payment.amount.toFixed(2)} USD</strong>. Por favor, introduce la tasa de cambio aplicada.
                            </p>
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tasa de Cambio (USD a {payment.paymentMethod === 'BOLIVARES' ? 'VES' : 'COP'})</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="Ej. 36.50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit">Confirmar Pago</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-4">
                        <p>El monto a pagar es <strong>${payment.amount.toFixed(2)} USD</strong> a través de {payment.paymentMethod}.</p>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSimpleConfirm}>Confirmar Pago</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'publisherName',
    header: 'Editor',
    cell: ({ row }) => {
      const { publisherName, publisherAvatarUrl } = row.original;
      const initials = publisherName?.split(' ').map(n => n[0]).join('') || 'N/A';
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={publisherAvatarUrl} alt={publisherName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{publisherName || 'No asignado'}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Monto Original (USD)',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('es-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'finalAmount',
    header: 'Total Convertido',
    cell: ({ row }) => {
      const payment = row.original;
      if (payment.status === 'Pagado' && payment.finalAmount && payment.finalCurrency) {
        const finalAmountFormatted = new Intl.NumberFormat(payment.finalCurrency === 'VES' ? 'es-VE' : 'es-CO', {
          style: 'currency',
          currency: payment.finalCurrency,
        }).format(payment.finalAmount);
        return <div className="font-medium">{finalAmountFormatted}</div>;
      }
      return <span className="text-muted-foreground">N/A</span>;
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método'
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const badgeVariant = {
        Pagado: 'default',
        Pendiente: 'secondary',
        Fallido: 'destructive',
      }[status] as 'default' | 'secondary' | 'destructive';
      const Icon = {
        Pagado: CheckCircle,
        Pendiente: AlertCircle,
        Fallido: XCircle,
      }[status]

      return (
        <Badge variant={badgeVariant} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            <span>{status}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: 'paymentDate',
    header: 'Fecha de Generación',
    cell: ({ row }) => {
        const date = row.original.paymentDate as any;
        const jsDate = date?.toDate ? date.toDate() : new Date(date);
        return format(jsDate, 'dd/MM/yyyy');
    },
  },
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const payment = row.original;
      const firestore = useFirestore();

      const handleMarkAsPaid = async (rate?: number) => {
          if (!firestore) return;
          const paymentRef = doc(firestore, 'payments', payment.id);
          try {
              let updateData: Partial<Payment> = {
                  status: 'Pagado',
              };

              if (rate && (payment.paymentMethod === 'BOLIVARES' || payment.paymentMethod === 'PESOS COLOMBIANOS')) {
                  updateData.exchangeRate = rate;
                  updateData.finalAmount = payment.amount * rate;
                  updateData.finalCurrency = payment.paymentMethod === 'BOLIVARES' ? 'VES' : 'COP';
              }

              await updateDoc(paymentRef, updateData);
              toast({ title: '¡Éxito!', description: 'El pago ha sido marcado como "Pagado".' });
          } catch (error) {
              console.error("Error updating payment:", error);
              toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del pago.' });
          }
      };

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
              {payment.status === 'Pendiente' && (
                <MarkAsPaidModal payment={payment} onConfirm={handleMarkAsPaid} />
              )}
              <DropdownMenuItem>Ver Detalles del Publisher</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
