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
import type { CompanyProfile, Payment } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MarkAsPaidModal = ({ payment, onConfirm, companyProfile }: { payment: Payment, onConfirm: (rate: number) => void, companyProfile: CompanyProfile | null }) => {
    const [open, setOpen] = useState(false);
    
    const isLocalPayment = payment.paymentMethod === 'BOLIVARES' || payment.paymentMethod === 'PESOS COLOMBIANOS';
    
    const rateToUse = payment.paymentMethod === 'BOLIVARES' 
        ? companyProfile?.usdToVesRate 
        : companyProfile?.usdToCopRate;

    const handleConfirm = () => {
        if (isLocalPayment) {
            if (rateToUse && rateToUse > 0) {
                onConfirm(rateToUse);
            } else {
                toast({ variant: 'destructive', title: 'Error: Tasa no configurada', description: 'Por favor, establece una tasa de cambio en la sección de Configuración antes de procesar este pago.' });
                return; // Prevent closing or confirming
            }
        } else {
            onConfirm(0); // No rate needed for USD payments
        }
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
                
                <div className="space-y-4">
                    {isLocalPayment ? (
                         <Alert variant={rateToUse && rateToUse > 0 ? 'default' : 'destructive'}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {rateToUse && rateToUse > 0 ? (
                                    <>
                                    Se aplicará la tasa de cambio de <strong>1 USD = {rateToUse} {payment.paymentMethod === 'BOLIVARES' ? 'VES' : 'COP'}</strong>. <br/>
                                    El monto original de <strong>${payment.amount.toFixed(2)} USD</strong> se convertirá a <strong>{new Intl.NumberFormat(payment.paymentMethod === 'BOLIVARES' ? 'es-VE' : 'es-CO', { style: 'currency', currency: payment.paymentMethod === 'BOLIVARES' ? 'VES' : 'COP' }).format(payment.amount * rateToUse)}</strong>.
                                    </>
                                ) : (
                                    "No se ha configurado una tasa de cambio para esta moneda. Ve a Configuración para añadirla."
                                )}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <p>El monto a pagar es <strong>${payment.amount.toFixed(2)} USD</strong> a través de {payment.paymentMethod}.</p>
                    )}
                </div>
                
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={isLocalPayment && (!rateToUse || rateToUse <= 0)}>Confirmar Pago</Button>
                </DialogFooter>
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
      
      const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
      const { data: companyProfile } = useDoc<CompanyProfile>(settingsRef);

      const handleMarkAsPaid = async (rate: number) => {
          if (!firestore) return;
          const paymentRef = doc(firestore, 'payments', payment.id);
          try {
              let updateData: Partial<Payment> = {
                  status: 'Pagado',
              };

              const isLocalPayment = payment.paymentMethod === 'BOLIVARES' || payment.paymentMethod === 'PESOS COLOMBIANOS';
              if (isLocalPayment && rate > 0) {
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
                <MarkAsPaidModal payment={payment} onConfirm={handleMarkAsPaid} companyProfile={companyProfile}/>
              )}
              <DropdownMenuItem>Ver Detalles del Publisher</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
