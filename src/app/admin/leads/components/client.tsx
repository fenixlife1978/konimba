'use client';
import { Plus, Save } from 'lucide-react';
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
import { useState, useMemo, useEffect, useRef } from 'react';

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
  const [activeDate, setActiveDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref to hold the imperative handle of the LeadGrid component
  const leadGridRef = useRef<{ getModifiedLeads: () => Record<string, number> }>(null);


  // Filter offers to only include active ones for the grid columns
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
      // 1. Fetch all leads within the selected date range directly from Firestore
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
      
      // 2. Aggregate leads to calculate payment amounts per publisher
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

      // 3. Create payment documents in a batch
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

        if (leadId !== 'new') { // Existing lead
          const docRef = doc(leadsRef, leadId);
          batch.update(docRef, { count });
        } else { // New lead
            if (count > 0) { // Only create if there's a value
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
      leadGridRef.current?.getModifiedLeads && Object.keys(modifiedLeads).forEach(key => delete modifiedLeads[key]); // Clear modified leads
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
              onDateChange={(range) => {
                if (range) setDateRange(range);
              }}
              onSingleDateChange={setActiveDate}
            />
        </div>
      </div>
      
      {activeDate && (
        <LeadGrid
            ref={leadGridRef}
            key={activeDate.toISOString()} // Force re-render when date changes
            publishers={publishers}
            offers={activeOffers}
            leads={data}
            date={activeDate}
        />
      )}
    </>
  );
};
