'use client';

import Image from 'next/image';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ShieldAlert, Receipt, CheckCircle, AlertCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const markAsPaidSchema = z.object({
  paidAt: z.date({ required_error: 'La fecha de pago es obligatoria.'}),
  exchangeRate: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
    // This part is handled by form logic, but keeping it as a double check
});

type MarkAsPaidFormValues = z.infer<typeof markAsPaidSchema>;


const MarkAsPaidModal = ({ payment, onConfirm }: { payment: Payment, onConfirm: (values: MarkAsPaidFormValues) => void }) => {
    const [open, setOpen] = useState(false);
    const isLocalPayment = payment.paymentMethod === 'BOLIVARES' || payment.paymentMethod === 'PESOS COLOMBIANOS';

    const form = useForm<MarkAsPaidFormValues>({
        resolver: zodResolver(markAsPaidSchema),
        defaultValues: {
            paidAt: new Date(),
            exchangeRate: undefined,
        }
    });

    const onSubmit = (data: MarkAsPaidFormValues) => {
        if (isLocalPayment && (!data.exchangeRate || data.exchangeRate <= 0)) {
            form.setError('exchangeRate', { type: 'custom', message: 'La tasa es requerida para pagos locales.' });
            return;
        }
        onConfirm(data);
        setOpen(false);
        form.reset();
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Marcar como Pagado</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Pago a {payment.publisherName}</DialogTitle>
                    <DialogDescription>
                        Completa la información para registrar el pago. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Alert variant="default">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Monto Original: <strong>${payment.amount.toFixed(2)} USD</strong> via {payment.paymentMethod}.
                            </AlertDescription>
                        </Alert>

                         <FormField
                            control={form.control}
                            name="paidAt"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Pago Efectivo</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP", { locale: es })
                                        ) : (
                                            <span>Elige una fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                        locale={es}
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isLocalPayment && (
                            <FormField
                                control={form.control}
                                name="exchangeRate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tasa de Cambio (1 USD a {payment.paymentMethod === 'BOLIVARES' ? 'VES' : 'COP'})</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            placeholder="Ej. 36.50" 
                                            {...field} 
                                            onChange={event => field.onChange(event.target.valueAsNumber)}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                        
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit">Confirmar y Guardar Pago</Button>
                        </DialogFooter>
                    </form>
                </Form>
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
    header: 'Total Pagado',
    cell: ({ row }) => {
      const payment = row.original;
      if (payment.status !== 'Pagado') return <span className="text-muted-foreground">N/A</span>;
      
      if (payment.finalAmount && payment.finalCurrency) {
        const finalAmountFormatted = new Intl.NumberFormat(payment.finalCurrency === 'VES' ? 'es-VE' : 'es-CO', {
          style: 'currency',
          currency: payment.finalCurrency,
        }).format(payment.finalAmount);
        return <div className="font-medium">{finalAmountFormatted}</div>;
      }

      // For PayPal/Binance
      const amount = parseFloat(row.getValue('amount'));
       const formatted = new Intl.NumberFormat('es-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      return <div className="font-medium">{formatted} ({payment.paymentMethod})</div>;
    },
  },
   {
    accessorKey: 'exchangeRate',
    header: 'Tasa Aplicada',
    cell: ({ row }) => {
      const payment = row.original;
      if (payment.status === 'Pagado' && payment.exchangeRate) {
        return <div>{payment.exchangeRate}</div>;
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
    accessorKey: 'paidAt',
    header: 'Fecha de Pago',
    cell: ({ row }) => {
        const date = row.original.paidAt as any;
        if (!date) return <span className="text-muted-foreground">Pendiente</span>;
        const jsDate = date?.toDate ? date.toDate() : new Date(date);
        return format(jsDate, 'dd/MM/yyyy');
    },
  },
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const payment = row.original;
      const firestore = useFirestore();

      const handleMarkAsPaid = async (values: MarkAsPaidFormValues) => {
          if (!firestore) return;
          const paymentRef = doc(firestore, 'payments', payment.id);
          try {
              let updateData: Partial<Payment> = {
                  status: 'Pagado',
                  paidAt: values.paidAt,
              };

              const isLocalPayment = payment.paymentMethod === 'BOLIVARES' || payment.paymentMethod === 'PESOS COLOMBIANOS';
              if (isLocalPayment && values.exchangeRate && values.exchangeRate > 0) {
                  updateData.exchangeRate = values.exchangeRate;
                  updateData.finalAmount = payment.amount * values.exchangeRate;
                  updateData.finalCurrency = payment.paymentMethod === 'BOLIVARES' ? 'VES' : 'COP';
              }

              await updateDoc(paymentRef, updateData as { [x: string]: any; });
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
