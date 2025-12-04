'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { GlobalOffer } from '@/lib/definitions';
import { useState } from 'react';

const offerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  payout: z.coerce.number().min(0, 'El pago debe ser un número positivo.'),
  currency: z.string().min(1, 'La moneda es requerida.'),
  status: z.enum(['Activa', 'Pausada', 'Eliminada']),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface OfferFormProps {
  initialData?: GlobalOffer;
  onSuccess?: () => void;
}

export function OfferForm({
  initialData,
  onSuccess,
}: OfferFormProps) {
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues = initialData
    ? {
        ...initialData,
        payout: initialData.payout ?? 0,
        currency: initialData.currency ?? 'USD',
        status: initialData.status ?? 'Activa',
      }
    : {
        name: '',
        payout: 0,
        currency: 'USD',
        status: 'Activa' as const,
      };

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues,
  });

  const onSubmit = async (data: OfferFormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        // Update existing global offer
        const offerRef = doc(
          firestore,
          'global-offers',
          initialData.id
        );
        await updateDoc(offerRef, {
          ...data,
        });
        toast({ title: '¡Éxito!', description: 'Oferta del catálogo actualizada correctamente.' });
      } else {
        // Create new global offer
        const offersCollection = collection(
          firestore,
          'global-offers'
        );
        // Firestore will auto-generate an ID
        const docRef = await addDoc(offersCollection, data);
        // We can update the doc with its own ID if we want to store it, which is good practice.
        await updateDoc(docRef, { id: docRef.id });
        toast({ title: '¡Éxito!', description: 'Oferta agregada al catálogo correctamente.' });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving global offer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la oferta en el catálogo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Oferta</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Campaña de Verano" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pago</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} disabled={isLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Activa">Activa</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                    <SelectItem value="Eliminada">Eliminada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Guardando...' : 'Guardar Oferta'}
        </Button>
      </form>
    </Form>
  );
}
