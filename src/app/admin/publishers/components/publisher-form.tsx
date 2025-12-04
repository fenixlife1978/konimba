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
import { useState, useEffect } from 'react';
import { banks } from '@/lib/banks';
import { Textarea } from '@/components/ui/textarea';

const baseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Email inválido.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  paymentMethod: z.enum(['PAYPAL', 'BINANCE', 'BOLIVARES', 'PESOS COLOMBIANOS']),
  status: z.enum(['Activo', 'Inactivo']),
  paymentDetails: z.string().optional(),
  country: z.enum(['Venezuela', 'Colombia']).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(['Ahorro', 'Corriente']).optional(),
  accountHolderName: z.string().optional(),
  accountHolderId: z.string().optional(),
});

const publisherSchema = baseSchema.superRefine((data, ctx) => {
  if (data.paymentMethod === 'PAYPAL' || data.paymentMethod === 'BINANCE') {
    if (!data.paymentDetails || data.paymentDetails.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentDetails'],
        message: 'Los detalles de pago son requeridos para este método.',
      });
    }
  }

  if (data.paymentMethod === 'BOLIVARES' || data.paymentMethod === 'PESOS COLOMBIANOS') {
    if (!data.bankName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankName'], message: 'El banco es requerido.' });
    }
    if (!data.accountNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountNumber'], message: 'El número de cuenta es requerido.' });
    }
    if (!data.accountType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountType'], message: 'El tipo de cuenta es requerido.' });
    }
    if (!data.accountHolderName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountHolderName'], message: 'El nombre del titular es requerido.' });
    }
    if (!data.accountHolderId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountHolderId'], message: 'La cédula o RIF es requerida.' });
    }
  }
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
        email: '',
        phone: '',
        paymentMethod: 'PAYPAL' as const,
        paymentDetails: '',
        status: 'Activo' as const,
      };

  const form = useForm<PublisherFormValues>({
    resolver: zodResolver(publisherSchema),
    defaultValues,
  });

  const paymentMethod = form.watch('paymentMethod');
  const country = form.watch('country');

  useEffect(() => {
    if (paymentMethod === 'BOLIVARES') {
      form.setValue('country', 'Venezuela');
    } else if (paymentMethod === 'PESOS COLOMBIANOS') {
      form.setValue('country', 'Colombia');
    }
  }, [paymentMethod, form]);

  const onSubmit = async (data: PublisherFormValues) => {
    setIsLoading(true);
    try {
      if (!firestore) throw new Error('Firestore no está disponible');
      
      let finalData: Partial<PublisherFormValues> = { ...data };

      // Clear irrelevant data based on payment method
      if (data.paymentMethod === 'PAYPAL' || data.paymentMethod === 'BINANCE') {
        finalData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          paymentMethod: data.paymentMethod,
          paymentDetails: data.paymentDetails,
          status: data.status,
        };
      } else if (data.paymentMethod === 'BOLIVARES' || data.paymentMethod === 'PESOS COLOMBIANOS') {
         finalData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          paymentMethod: data.paymentMethod,
          status: data.status,
          country: data.country,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountType: data.accountType,
          accountHolderName: data.accountHolderName,
          accountHolderId: data.accountHolderId,
        };
      }


      if (initialData) {
        // Update existing publisher
        const publisherRef = doc(firestore, 'publishers', initialData.id);
        await updateDoc(publisherRef, {
          ...finalData,
        });
        toast({ title: '¡Éxito!', description: 'Editor actualizado correctamente.' });
      } else {
        // Create new publisher
        const publishersCollection = collection(firestore, 'publishers');
        const docRef = await addDoc(publishersCollection, {
          ...finalData,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Editor</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Juan Pérez" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="juan.perez@email.com" {...field} disabled={isLoading} />
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
                        <SelectItem value="PAYPAL">PAYPAL</SelectItem>
                        <SelectItem value="BINANCE">BINANCE</SelectItem>
                        <SelectItem value="BOLIVARES">BOLIVARES</SelectItem>
                        <SelectItem value="PESOS COLOMBIANOS">PESOS COLOMBIANOS</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            {(paymentMethod === 'PAYPAL' || paymentMethod === 'BINANCE') && (
               <FormField
                control={form.control}
                name="paymentDetails"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Detalles de Pago</FormLabel>
                    <FormControl>
                        <Input placeholder="Email de PayPal o Wallet de Binance" {...field} value={field.value || ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            )}
             {(paymentMethod === 'BOLIVARES' || paymentMethod === 'PESOS COLOMBIANOS') && (
                <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} readOnly disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
        </div>

        {(paymentMethod === 'BOLIVARES' || paymentMethod === 'PESOS COLOMBIANOS') && (
            <div className="space-y-4 border p-4 rounded-md">
                 <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading || !country}
                        >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un banco" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {country && banks[country].map((bank) => (
                                <SelectItem key={bank.code} value={bank.name}>
                                    {bank.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre Completo del Titular</FormLabel>
                        <FormControl>
                            <Input placeholder="Nombre como aparece en el banco" {...field} value={field.value || ''} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="accountHolderId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cédula / RIF</FormLabel>
                            <FormControl>
                                <Input placeholder="V-12345678" {...field} value={field.value || ''} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Cuenta</FormLabel>
                             <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading}
                                >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Ahorro">Ahorro</SelectItem>
                                    <SelectItem value="Corriente">Corriente</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número de Cuenta</FormLabel>
                        <FormControl>
                            <Input placeholder="0102..." {...field} value={field.value || ''} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

            </div>
        )}

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
