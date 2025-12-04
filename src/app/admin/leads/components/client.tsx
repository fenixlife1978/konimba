'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lead, Publisher, GlobalOffer } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LeadForm } from './lead-form';
import { useState } from 'react';
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
  addDoc,
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { PeriodSelector } from './period-selector';
import type { DateRange } from 'react-day-picker';

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
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const firestore = useFirestore();

  const handleClosePeriod = async () => {
    if (!firestore) return;
    if (!dateRange || !dateRange.from || !dateRange.to) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona un período válido antes de cerrar.',
      });
      return;
    }

    try {
      // 1. Filter leads within the selected date range
      const filteredLeads = data.filter((lead) => {
        const leadDate =
          typeof (lead.date as any).toDate === 'function'
            ? (lead.date as any).toDate()
            : new Date(lead.date);
        return leadDate >= dateRange.from! && leadDate <= dateRange.to!;
      });

      if (filteredLeads.length === 0) {
        toast({
          title: 'No hay leads',
          description:
            'No se encontraron leads en el período seleccionado para generar pagos.',
        });
        return;
      }
      
      // 2. Aggregate leads to calculate payment amounts per publisher
      const paymentsToCreate: Record<
        string,
        { amount: number; publisher: Publisher; leads: Lead[] }
      > = {};

      filteredLeads.forEach((lead) => {
        const offer = offers.find((o) => o.id === lead.offerId);
        if (!offer) return;

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
          paymentDate: serverTimestamp(),
          paymentMethod: paymentData.publisher.paymentMethod,
          status: 'Pendiente',
          notes: `Pago generado por cierre de periodo. Incluye ${paymentData.leads.length} registros de leads.`,
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
    }
  };

  const filteredData = dateRange?.from ? data.filter(lead => {
    const leadDate = typeof (lead.date as any).toDate === 'function' ? (lead.date as any).toDate() : new Date(lead.date as string);
    const from = dateRange.from;
    const to = dateRange.to || from; // If no 'to' date, filter for a single day

    // Normalize dates to ignore time
    const leadDay = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    
    return leadDay >= fromDay && leadDay <= toDay;
  }) : data;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PeriodSelector onDateChange={setDateRange} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Cerrar Periodo y Generar Pagos</Button>
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
                  <AlertDialogAction onClick={handleClosePeriod}>
                    Confirmar y Generar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Cargar Leads
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cargar Nuevos Leads</DialogTitle>
          </DialogHeader>
          <LeadForm
            publishers={publishers}
            offers={offers}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <DataTable
        searchKey="publisherName"
        columns={columns({ publishers, offers })}
        data={filteredData}
      />
    </>
  );
};
