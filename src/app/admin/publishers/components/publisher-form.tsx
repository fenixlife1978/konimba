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
  paymentMethod: z.enum(['USDT', 'Paypal', 'Bolivares', 'Pesos Colombianos']),
  status: z.enum(['Activo', 'Inactivo']),
  paymentDetails: z.string().optional(),
  usdtExchange: z.string().optional(),
  usdtWallet: z.string().optional(),
  country: z.enum(['Venezuela', 'Colombia']).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(['Ahorro', 'Corriente']).optional(),
  accountHolderName: z.string().optional(),
  accountHolderId: z.string().optional(),
});

const publisherSchema = baseSchema.superRefine((data, ctx) => {
  if (data.paymentMethod === 'Paypal') {
    if (!data.paymentDetails || data.paymentDetails.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentDetails'],
        message: 'El email de Paypal es requerido.',
      });
    }
  }

  if (data.paymentMethod === 'USDT') {
    if (!data.usdtExchange) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['usdtExchange'],
            message: 'El exchange es requerido.',
        });
    }
    if (!data.usdtWallet) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['usdtWallet'],
            message: 'La dirección de la wallet es requerida.',
        });
    }
  }

  if (data.paymentMethod === 'Bolivares' || data.paymentMethod === 'Pesos Colombianos') {
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
        paymentMethod: 'Paypal' as const,
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
    if (paymentMethod === 'Bolivares') {
      form.setValue('country', 'Venezuela');
    } else if (paymentMethod === 'Pesos Colombianos') {
      form.setValue('country', 'Colombia');
    }
  }, [paymentMethod, form]);

  const onSubmit = async (data: PublisherFormValues) => {
    setIsLoading(true);
    try {
      if (!firestore) throw new Error('Firestore no está disponible');
      
      let finalData: Partial<PublisherFormValues> = { ...data };
      
      const commonData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        paymentMethod: data.paymentMethod,
        status: data.status,
      }

      // Clear irrelevant data based on payment method
      if (data.paymentMethod === 'Paypal') {
        finalData = { ...commonData, paymentDetails: data.paymentDetails };
      } else if (data.paymentMethod === 'USDT') {
        finalData = { ...commonData, usdtExchange: data.usdtExchange, usdtWallet: data.usdtWallet };
      } else if (data.paymentMethod === 'Bolivares' || data.paymentMethod === 'Pesos Colombianos') {
         finalData = {
          ...commonData,
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
        
        <div className="grid grid-cols-1">
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
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="Paypal">Paypal</SelectItem>
                        <SelectItem value="Bolivares">Bolivares</SelectItem>
                        <SelectItem value="Pesos Colombianos">Pesos Colombianos</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        {paymentMethod === 'Paypal' && (
            <FormField
            control={form.control}
            name="paymentDetails"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email de Paypal</FormLabel>
                <FormControl>
                    <Input placeholder="Email de PayPal" {...field} value={field.value || ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        )}
        
        {paymentMethod === 'USDT' && (
            <div className="space-y-4 border p-4 rounded-md">
                <FormField
                    control={form.control}
                    name="usdtExchange"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Exchange</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Binance" {...field} value={field.value || ''} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="usdtWallet"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Dirección de Wallet (USDT - TRC20)</FormLabel>
                        <FormControl>
                            <Input placeholder="T..." {...field} value={field.value || ''} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

        {(paymentMethod === 'Bolivares' || paymentMethod === 'Pesos Colombianos') && (
            <div className="space-y-4 border p-4 rounded-md">
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
