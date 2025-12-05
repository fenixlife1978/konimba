'use client';
import type { Payment } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { CompanyProfile } from '@/lib/definitions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Cog } from 'lucide-react';

interface PaymentClientProps {
  data: Payment[];
}

const ratesSchema = z.object({
  usdToVesRate: z.coerce.number().positive('La tasa debe ser un número positivo').optional(),
  usdToCopRate: z.coerce.number().positive('La tasa debe ser un número positivo').optional(),
});
type RatesFormValues = z.infer<typeof ratesSchema>;


const ManageRatesModal = () => {
    const [open, setOpen] = useState(false);
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
    const { data: companyProfile, isLoading: isProfileLoading } = useDoc<CompanyProfile>(settingsRef);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RatesFormValues>({
        resolver: zodResolver(ratesSchema),
        defaultValues: {
            usdToVesRate: 0,
            usdToCopRate: 0,
        },
    });

    useEffect(() => {
        if (companyProfile) {
            form.reset({
                usdToVesRate: companyProfile.usdToVesRate,
                usdToCopRate: companyProfile.usdToCopRate,
            });
        }
    }, [companyProfile, form]);

    const onSubmit = async (data: RatesFormValues) => {
        if (!settingsRef) return;
        setIsSubmitting(true);
        try {
            await setDoc(settingsRef, data, { merge: true });
            toast({
                title: '¡Éxito!',
                description: 'Las tasas de cambio han sido actualizadas.',
            });
            setOpen(false);
        } catch (error) {
            console.error('Error saving rates:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar la configuración de tasas.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Cog className="mr-2 h-4 w-4" />
                    Gestión de Tasas
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Tasas de Cambio</DialogTitle>
                    <DialogDescription>
                        Establece las tasas que se usarán al procesar los pagos en moneda local.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="usdToVesRate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tasa USD a Bolívares (VES)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" placeholder="Ej: 36.54" {...field} value={field.value || ''} disabled={isSubmitting || isProfileLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="usdToCopRate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tasa USD a Pesos Colombianos (COP)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" placeholder="Ej: 3910.50" {...field} value={field.value || ''} disabled={isSubmitting || isProfileLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting || isProfileLoading}>
                                {isSubmitting ? 'Guardando...' : 'Guardar Tasas'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export const PaymentClient: React.FC<PaymentClientProps> = ({ data }) => {
  return (
    <>
       <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Aquí puedes revisar y procesar todos los pagos pendientes generados.
        </p>
        <div className="flex items-center gap-2">
            <ManageRatesModal />
        </div>
      </div>
      <DataTable searchKey="publisherName" columns={columns} data={data} />
    </>
  );
};
