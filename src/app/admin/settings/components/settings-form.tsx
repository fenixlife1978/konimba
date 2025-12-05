'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { CompanyProfile } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const settingsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  country: z.string().min(1, 'El país es requerido.'),
  address: z.string().min(1, 'La dirección es requerida.'),
  logoUrl: z.string().min(1, 'El logo es requerido.'),
  usdToVesRate: z.coerce.number().positive('La tasa debe ser un número positivo').optional(),
  usdToCopRate: z.coerce.number().positive('La tasa debe ser un número positivo').optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
  const { data: initialData, isLoading: isDataLoading } = useDoc<CompanyProfile>(settingsRef);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      phone: '',
      country: '',
      address: '',
      logoUrl: '',
      usdToVesRate: 0,
      usdToCopRate: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      if (initialData.logoUrl) {
        setLogoPreview(initialData.logoUrl);
      }
    }
  }, [initialData, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          form.setValue('logoUrl', base64String);
          setLogoPreview(base64String);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
            variant: 'destructive',
            title: 'Formato de archivo no válido',
            description: 'Por favor, sube un archivo PNG o JPG.',
        });
      }
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    if (!settingsRef) return;
    setIsSubmitting(true);
    try {
      await setDoc(settingsRef, data, { merge: true });
      toast({
        title: '¡Éxito!',
        description: 'La configuración de la empresa ha sido actualizada.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="space-y-8">
        <Card className="max-w-2xl">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
        <Card className="max-w-2xl">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
        </div>
    )
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Datos Generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. KonimPay Inc." {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Teléfono de Contacto</FormLabel>
                            <FormControl>
                                <Input placeholder="+1 234 567 890" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Venezuela" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Dirección Fiscal</FormLabel>
                        <FormControl>
                            <Input placeholder="Av. Principal, Edificio Central, Piso 1" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Logotipo de la Empresa</FormLabel>
                        {logoPreview && (
                            <div className="mt-2 p-4 border rounded-md flex justify-center items-center bg-muted/50 h-32">
                                <div className="relative h-24 w-48">
                                    <Image src={logoPreview} alt="Vista previa del logo" fill style={{objectFit: 'contain'}} />
                                </div>
                            </div>
                        )}
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/png, image/jpeg"
                                onChange={handleLogoChange}
                                disabled={isSubmitting} 
                                className='pt-2'
                            />
                        </FormControl>
                        <FormDescription>
                            Sube un archivo PNG o JPG. La imagen se mostrará en toda la aplicación.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Tasas de Conversión</CardTitle>
                    <CardDescription>
                        Establece las tasas de cambio que se usarán para procesar los pagos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="usdToVesRate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tasa USD a Bolívares (VES)</FormLabel>
                            <FormControl>
                                <Input type="number" step="any" placeholder="Ej: 36.54" {...field} value={field.value || ''} disabled={isSubmitting} />
                            </FormControl>
                            <FormDescription>
                                1 Dólar Americano equivale a X Bolívares.
                            </FormDescription>
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
                                <Input type="number" step="any" placeholder="Ej: 3910.50" {...field} value={field.value || ''} disabled={isSubmitting} />
                            </FormControl>
                             <FormDescription>
                                1 Dólar Americano equivale a X Pesos Colombianos.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>
            <Button type="submit" disabled={isSubmitting || isDataLoading} className="w-full max-w-2xl">
              {isSubmitting ? 'Guardando Cambios...' : 'Guardar Toda la Configuración'}
            </Button>
        </form>
    </Form>
  );
}
