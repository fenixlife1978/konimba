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
import type { Lead, Publisher, GlobalOffer } from '@/lib/definitions';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { es } from 'date-fns/locale';

const leadSchema = z.object({
  publisherId: z.string().min(1, 'El editor es requerido.'),
  offerId: z.string().min(1, 'La oferta es requerida.'),
  date: z.date({
    required_error: 'La fecha es requerida.',
  }),
  count: z.coerce.number().int().min(0, 'La cantidad de leads debe ser un número positivo.'),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  initialData?: Lead;
  publishers: Publisher[];
  offers: GlobalOffer[];
  onSuccess?: () => void;
}

export function LeadForm({
  initialData,
  publishers,
  offers,
  onSuccess,
}: LeadFormProps) {
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  // Firestore timestamps can be objects, so we need to handle them
  const initialDate = initialData?.date ? 
    (typeof (initialData.date as any).toDate === 'function' ? (initialData.date as any).toDate() : new Date(initialData.date)) 
    : undefined;

  const defaultValues = initialData
    ? {
        ...initialData,
        date: initialDate,
        count: initialData.count ?? 0,
      }
    : {
        publisherId: '',
        offerId: '',
        date: new Date(),
        count: 0,
      };

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsLoading(true);
    try {
      if (!firestore) throw new Error("Firestore not available");
      const leadsCollection = collection(firestore, 'leads');

      if (initialData) {
        // Update existing lead record
        const leadRef = doc(firestore, 'leads', initialData.id);
        await updateDoc(leadRef, { ...data });
        toast({ title: '¡Éxito!', description: 'Registro de leads actualizado correctamente.' });
      } else {
        // Create new lead record
        const docRef = await addDoc(leadsCollection, data);
        await updateDoc(docRef, { id: docRef.id }); // Store the ID within the document
        toast({ title: '¡Éxito!', description: 'Leads cargados correctamente.' });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving leads:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el registro de leads.',
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
          name="publisherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Editor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un editor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {publishers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
          name="offerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Oferta del Catálogo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una oferta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {offers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Fecha de los Leads</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
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
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cantidad de Leads</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Cargar Leads')}
        </Button>
      </form>
    </Form>
  );
}
