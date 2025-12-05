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
import { useFirestore } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { Lead, Publisher, GlobalOffer } from '@/lib/definitions';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

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
      
      const publisherName = publishers.find(p => p.id === data.publisherId)?.name || 'Desconocido';
      const offerName = offers.find(o => o.id === data.offerId)?.name || 'Desconocido';

      const leadData = {
        ...data,
        publisherName,
        offerName,
      };
      
      if (initialData) {
        // Update existing lead record
        const leadRef = doc(firestore, 'leads', initialData.id);
        await updateDoc(leadRef, leadData);
        toast({ title: '¡Éxito!', description: 'Registro de leads actualizado correctamente.' });
      } else {
        // Create new lead record
        const leadsCollection = collection(firestore, 'leads');
        const docRef = await addDoc(leadsCollection, leadData);
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
            <FormItem className="flex flex-col">
              <FormLabel>Editor</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? publishers.find(
                              (p) => p.id === field.value
                            )?.name
                          : "Selecciona un editor"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar editor..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el editor.</CommandEmpty>
                        <CommandGroup>
                          {publishers.map((p) => (
                            <CommandItem
                              value={p.name}
                              key={p.id}
                              onSelect={() => {
                                form.setValue("publisherId", p.id)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  p.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="offerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Oferta del Catálogo</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? offers.find(
                              (o) => o.id === field.value
                            )?.name
                          : "Selecciona una oferta"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar oferta..." />
                       <CommandList>
                        <CommandEmpty>No se encontró la oferta.</CommandEmpty>
                        <CommandGroup>
                          {offers.map((o) => (
                            <CommandItem
                              value={o.name}
                              key={o.id}
                              onSelect={() => {
                                form.setValue("offerId", o.id)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  o.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {o.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
