'use client';

import Image from 'next/image';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ShieldAlert, Receipt, CheckCircle, AlertCircle, XCircle, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
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
  DropdownMenuSeparator,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CompanyProfile } from '@/lib/definitions';
import { useDoc, useMemoFirebase } from '@/firebase';


interface ColumnsProps {
    liveRates?: {
        usdToVesRate?: number;
        usdToCopRate?: number;
    }
}

const markAsPaidSchema = z.object({
  paidAt: z.date({ required_error: 'La fecha de pago es obligatoria.'}),
  exchangeRate: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
    // This part is handled by form logic, but keeping it as a double check
});

type MarkAsPaidFormValues = z.infer<typeof markAsPaidSchema>;


const MarkAsPaidModal = ({ payment, companyProfile, onConfirm }: { payment: Payment, companyProfile?: CompanyProfile | null, onConfirm: (values: MarkAsPaidFormValues) => void }) => {
    const [open, setOpen] = useState(false);
    const isLocalPayment = payment.paymentMethod === 'Bolivares' || payment.paymentMethod === 'Pesos Colombianos';

    const defaultExchangeRate = payment.paymentMethod === 'Bolivares' 
        ? companyProfile?.usdToVesRate 
        : companyProfile?.usdToCopRate;

    const form = useForm<MarkAsPaidFormValues>({
        resolver: zodResolver(markAsPaidSchema),
        defaultValues: {
            paidAt: new Date(),
            exchangeRate: defaultExchangeRate,
        }
    });
     
    useEffect(() => {
        if(companyProfile) {
            form.reset({
                paidAt: new Date(),
                exchangeRate: defaultExchangeRate
            });
        }
    }, [companyProfile, defaultExchangeRate, form]);


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
                                    <FormLabel>Tasa de Cambio (1 USD a {payment.paymentMethod === 'Bolivares' ? 'VES' : 'COP'})</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            placeholder={`Ej. ${defaultExchangeRate || '36.50'}`}
                                            {...field}
                                            onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))}
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

const DeleteConfirmationDialog = ({ payment, onConfirm }: { payment: Payment; onConfirm: () => void }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Pago
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del pago para{' '}
            <span className="font-semibold">{payment.publisherName}</span> por un monto de{' '}
            <span className="font-semibold">${payment.amount.toFixed(2)}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Sí, eliminar permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export const columns = ({ liveRates = {} }: ColumnsProps): ColumnDef<Payment>[] => [
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
    header: 'Total a Pagar',
    cell: ({ row }) => {
      const payment = row.original;
      
      if (payment.status === 'Pagado') {
        if (payment.finalAmount && payment.finalCurrency) {
          const finalAmountFormatted = new Intl.NumberFormat(payment.finalCurrency === 'VES' ? 'es-VE' : 'es-CO', {
            style: 'currency',
            currency: payment.finalCurrency,
          }).format(payment.finalAmount);
          return <div className="font-medium">{finalAmountFormatted}</div>;
        }
         // For paid PayPal/Binance
         return <div className="font-medium">{new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(payment.amount)} ({payment.paymentMethod})</div>;
      }
      
      // For Pending payments
      if (payment.status === 'Pendiente') {
         if (payment.paymentMethod === 'Bolivares' && liveRates.usdToVesRate) {
            const converted = payment.amount * liveRates.usdToVesRate;
            return <div className="font-medium text-muted-foreground">{new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES'}).format(converted)}</div>;
         }
         if (payment.paymentMethod === 'Pesos Colombianos' && liveRates.usdToCopRate) {
            const converted = payment.amount * liveRates.usdToCopRate;
            return <div className="font-medium text-muted-foreground">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP'}).format(converted)}</div>;
         }
         if(payment.paymentMethod === 'Paypal' || payment.paymentMethod === 'USDT') {
             return <div className="font-medium text-muted-foreground">{new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(payment.amount)} ({payment.paymentMethod})</div>;
         }
      }

      return <span className="text-muted-foreground">N/A</span>;
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
       if (payment.status === 'Pendiente') {
         if (payment.paymentMethod === 'Bolivares' && liveRates.usdToVesRate) {
            return <div className="text-muted-foreground">{liveRates.usdToVesRate}</div>;
         }
         if (payment.paymentMethod === 'Pesos Colombianos' && liveRates.usdToCopRate) {
            return <div className="text-muted-foreground">{liveRates.usdToCopRate}</div>;
         }
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
    accessorKey: 'createdAt',
    header: 'Fecha de Creación',
    cell: ({ row }) => {
      const date = row.original.createdAt as any;
      if (!date) return <span className="text-muted-foreground">N/A</span>;
      const jsDate = date?.toDate ? date.toDate() : new Date(date);
      return format(jsDate, 'dd/MM/yyyy');
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
      
      const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
      const { data: companyProfile } = useDoc<CompanyProfile>(settingsRef);

      const handleMarkAsPaid = async (values: MarkAsPaidFormValues) => {
          if (!firestore) return;
          const paymentRef = doc(firestore, 'payments', payment.id);
          try {
              let updateData: Partial<Payment> = {
                  status: 'Pagado',
                  paidAt: values.paidAt,
                  exchangeRate: undefined,
                  finalAmount: undefined,
                  finalCurrency: undefined,
              };

              const isLocalPayment = payment.paymentMethod === 'Bolivares' || payment.paymentMethod === 'Pesos Colombianos';
              if (isLocalPayment && values.exchangeRate && values.exchangeRate > 0) {
                  updateData.exchangeRate = values.exchangeRate;
                  updateData.finalAmount = payment.amount * values.exchangeRate;
                  updateData.finalCurrency = payment.paymentMethod === 'Bolivares' ? 'VES' : 'COP';
              } else {
                  updateData.finalAmount = payment.amount;
                  updateData.finalCurrency = payment.currency === 'USD' ? undefined : payment.currency;
              }


              await updateDoc(paymentRef, updateData as { [x: string]: any; });
              toast({ title: '¡Éxito!', description: 'El pago ha sido marcado como "Pagado".' });
          } catch (error) {
              console.error("Error updating payment:", error);
              toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del pago.' });
          }
      };

      const handleDelete = async () => {
        if (!firestore) return;
        const paymentRef = doc(firestore, 'payments', payment.id);
        try {
          await deleteDoc(paymentRef);
          toast({
            title: 'Pago Eliminado',
            description: `El registro de pago para "${payment.publisherName}" ha sido eliminado.`,
          });
        } catch (error) {
          console.error("Error deleting payment:", error);
          toast({
            variant: 'destructive',
            title: 'Error al Eliminar',
            description: 'No se pudo eliminar el registro del pago.',
          });
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
                <MarkAsPaidModal payment={payment} companyProfile={companyProfile} onConfirm={handleMarkAsPaid} />
              )}
              <DropdownMenuItem>Ver Detalles del Publisher</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteConfirmationDialog payment={payment} onConfirm={handleDelete} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
