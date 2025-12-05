'use client';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lead, Publisher, GlobalOffer } from '@/lib/definitions';
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
import { useFirestore } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { PeriodSelector } from './period-selector';
import type { DateRange } from 'react-day-picker';
import { LeadGrid } from './lead-grid';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { LeadGridHandle } from './lead-grid';
import { format } from 'date-fns';

interface LeadClientProps {
  data: Lead[];
  publishers: Publisher[];
  offers: GlobalOffer[];
}

export const LeadClient: React.FC<LeadClientProps> = ({
  data,
  publishers,
  offers,
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const firestore = useFirestore();
  const [isClosingPeriod, setIsClosingPeriod] = useState(false);
  const [activeDate, setActiveDate] = useState<Date>();
  const [isSaving, setIsSaving] = useState(false);
  
  const leadGridRef = useRef<LeadGridHandle>(null);

  useEffect(() => {
    // Set initial date on client-side only to prevent hydration mismatch
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setActiveDate(today);
  }, []);

  const leadsForActiveDate = useMemo(() => {
    if (!activeDate || !data) return [];
    const targetDateString = format(activeDate, 'yyyy-MM-dd');
    return data.filter(lead => {
        const leadDate = lead.date instanceof Date ? lead.date : (lead.date as any)?.toDate?.();
        if (!leadDate) return false;
        return format(leadDate, 'yyyy-MM-dd') === targetDateString;
    });
  }, [data, activeDate]);


  const activeOffers = useMemo(() => offers.filter(o => o.status === 'Activa'), [offers]);


  const handleClosePeriod = async () => {
    setIsClosingPeriod(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Servicio de base de datos no disponible.' });
      setIsClosingPeriod(false);
      return;
    }
    if (!dateRange || !dateRange.from || !dateRange.to) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona un período válido antes de cerrar.',
      });
      setIsClosingPeriod(false);
      return;
    }

    try {
      const leadsRef = collection(firestore, 'leads');
      const leadsQuery = query(
        leadsRef,
        where('date', '>=', dateRange.from),
        where('date', '<=', dateRange.to)
      );

      const querySnapshot = await getDocs(leadsQuery);
      const leadsInPeriod: Lead[] = [];
      querySnapshot.forEach((doc) => {
        leadsInPeriod.push({ id: doc.id, ...doc.data() } as Lead);
      });

      if (leadsInPeriod.length === 0) {
        toast({
          title: 'No hay leads',
          description:
            'No se encontraron leads en el período seleccionado para generar pagos.',
        });
        setIsClosingPeriod(false);
        return;
      }
      
      const paymentsToCreate: Record<
        string,
        { amount: number; publisher: Publisher; leads: Lead[] }
      > = {};

      leadsInPeriod.forEach((lead) => {
        const offer = offers.find((o) => o.id === lead.offerId);
        if (!offer || lead.count === 0) return;

        const paymentAmount = lead.count * offer.payout;
        const publisher = publishers.find((p) => p.id === lead.publisherId);
        if (!publisher) return;

        if (!paymentsToCreate[lead.publisherId]) {
          paymentsToCreate[lead.publisherId] = {
            amount: 0,
            publisher,
            leads: [],
          };
        }
        paymentsToCreate[lead.publisherId].amount += paymentAmount;
        paymentsToCreate[lead.publisherId].leads.push(lead);
      });

      const batch = writeBatch(firestore);
      const paymentsCollection = collection(firestore, 'payments');

      for (const publisherId in paymentsToCreate) {
        const paymentData = paymentsToCreate[publisherId];
        const newPaymentRef = doc(paymentsCollection);

        batch.set(newPaymentRef, {
          id: newPaymentRef.id,
          publisherId: publisherId,
          publisherName: paymentData.publisher.name,
          publisherAvatarUrl: paymentData.publisher.avatarUrl || '',
          amount: paymentData.amount,
          currency: 'USD',
          createdAt: serverTimestamp(),
          paymentMethod: paymentData.publisher.paymentMethod,
          status: 'Pendiente',
          notes: `Pago generado por cierre de periodo de ${dateRange.from.toLocaleDateString()} a ${dateRange.to.toLocaleDateString()}. Incluye ${paymentData.leads.length} registros de leads.`,
        });
      }

      await batch.commit();

      toast({
        title: '¡Periodo Cerrado!',
        description: `${
          Object.keys(paymentsToCreate).length
        } pagos han sido generados y están pendientes de procesamiento.`,
      });
    } catch (error) {
      console.error('Error closing period:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar el periodo y generar los pagos.',
      });
    } finally {
        setIsClosingPeriod(false);
    }
  };

  const handleSave = async () => {
    const modifiedLeads = leadGridRef.current?.getModifiedLeads();
    if (!modifiedLeads || Object.keys(modifiedLeads).length === 0) {
      toast({ title: 'Sin cambios', description: 'No hay modificaciones para guardar.' });
      return;
    }
    if (!firestore || !activeDate) {
      toast({ variant: 'destructive', title: 'Error', description: 'Servicio de base de datos no disponible o fecha no seleccionada.' });
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      const leadsRef = collection(firestore, 'leads');

      for (const key in modifiedLeads) {
        const [publisherId, offerId, leadId] = key.split('__');
        const count = modifiedLeads[key];
        const publisher = publishers.find(p => p.id === publisherId);
        const offer = offers.find(o => o.id === offerId);

        if (leadId !== 'new') { 
          const docRef = doc(leadsRef, leadId);
          batch.update(docRef, { count });
        } else { 
            if (count > 0) { 
                const newDocRef = doc(leadsRef);
                batch.set(newDocRef, {
                    id: newDocRef.id,
                    publisherId,
                    offerId,
                    date: activeDate,
                    count,
                    publisherName: publisher?.name || 'N/A',
                    offerName: offer?.name || 'N/A'
                });
            }
        }
      }

      await batch.commit();
      toast({ title: '¡Éxito!', description: 'Los cambios en los leads han sido guardados.'});
      leadGridRef.current?.clearModifiedLeads();
    } catch (error) {
      console.error('Error saving leads:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isClosingPeriod}>
                    {isClosingPeriod ? 'Generando Pagos...' : 'Cerrar Periodo y Generar Pagos'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>
                        ¿Confirmar Cierre de Periodo?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción calculará y generará los registros de pago para
                        todos los publishers basados en los leads cargados en el
                        periodo seleccionado. Los pagos se crearán en estado
                        "Pendiente". ¿Estás seguro?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClosePeriod} disabled={isClosingPeriod}>
                        {isClosingPeriod ? 'Procesando...' : 'Confirmar y Generar'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
                 <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
            <PeriodSelector
              onDateChange={setDateRange}
              onSingleDateChange={setActiveDate}
            />
        </div>
      </div>
      
      {activeDate && (
        <LeadGrid
            ref={leadGridRef}
            key={activeDate.toISOString()}
            publishers={publishers}
            offers={activeOffers}
            leads={leadsForActiveDate}
            date={activeDate}
        />
      )}
    </>
  );
};
