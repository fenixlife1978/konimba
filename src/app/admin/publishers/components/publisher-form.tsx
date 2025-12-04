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
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { Publisher } from '@/lib/definitions';
import { useState } from 'react';

const publisherSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  contactName: z.string().min(1, 'El nombre de contacto es requerido.'),
  email: z.string().email('Email inválido.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  paymentMethod: z.enum(['PayPal', 'Transferencia Bancaria', 'Payoneer']),
  paymentDetails: z.string().min(1, 'Los detalles de pago son requeridos.'),
  status: z.enum(['Activo', 'Inactivo']),
});

type PublisherFormValues = z.infer<typeof publisherSchema>;

interface PublisherFormProps {
  initialData?: Publisher;
  onSuccess?: () => void;
}

export function PublisherForm({
  initialData,
  onSuccess,
}: PublisherFormProps) {
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues = initialData
    ? {
        ...initialData,
        status: initialData.status ?? 'Activo',
      }
    : {
        name: '',
        contactName: '',
        email: '',
        phone: '',
        paymentMethod: 'PayPal' as const,
        paymentDetails: '',
        status: 'Activo' as const,
      };

  const form = useForm<PublisherFormValues>({
    resolver: zodResolver(publisherSchema),
    defaultValues,
  });

  const onSubmit = async (data: PublisherFormValues) => {
    setIsLoading(true);
    try {
      if (!firestore) throw new Error('Firestore no está disponible');
      if (initialData) {
        // Update existing publisher
        const publisherRef = doc(firestore, 'publishers', initialData.id);
        await updateDoc(publisherRef, {
          ...data,
        });
        toast({ title: '¡Éxito!', description: 'Editor actualizado correctamente.' });
      } else {
        // Create new publisher
        const publishersCollection = collection(firestore, 'publishers');
        const docRef = await addDoc(publishersCollection, {
          ...data,
          createdAt: serverTimestamp(),
        });
        await updateDoc(docRef, { id: docRef.id });
        toast({ title: '¡Éxito!', description: 'Editor creado correctamente.' });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving publisher:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el editor.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Editor</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Acme Inc." {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Juan Pérez" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="contacto@acme.com" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                    <Input placeholder="+1 234 567 890" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                    >
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                        <SelectItem value="Payoneer">Payoneer</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="paymentDetails"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Detalles de Pago</FormLabel>
                    <FormControl>
                        <Input placeholder="Email de PayPal, cuenta bancaria, etc." {...field} disabled={isLoading} />
                    </FormControl>
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
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <Button type="submit" disabled={isLoading} className="w-full mt-6">
            {isLoading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Editor')}
        </Button>
      </form>
    </Form>
  );
}
