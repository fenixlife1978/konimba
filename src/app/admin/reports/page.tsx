'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Publisher, GlobalOffer, Lead } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PublisherReportCard } from './components/publisher-report-card';
import { startOfMonth, endOfMonth } from 'date-fns';
import { MonthYearPicker } from './components/month-year-picker';

export default function AdminReportsPage() {
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  });

  useEffect(() => {
    setDateRange({
        from: startOfMonth(currentDate),
        to: endOfMonth(currentDate)
    });
  }, [currentDate]);


  const publishersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'publishers') : null),
    [firestore]
  );
  const { data: publishers, isLoading: publishersLoading } =
    useCollection<Publisher>(publishersRef);

  const offersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'global-offers') : null),
    [firestore]
  );
  const { data: offers, isLoading: offersLoading } =
    useCollection<GlobalOffer>(offersRef);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !dateRange?.from || !dateRange?.to) return null;
    return query(
      collection(firestore, 'leads'),
      where('date', '>=', dateRange.from),
      where('date', '<=', dateRange.to)
    );
  }, [firestore, dateRange]);
  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);

  const publishersWithLeads = useMemo(() => {
    if (!publishers || !leads) return [];
    
    const publisherLeadsMap = new Map<string, Lead[]>();
    leads.forEach(lead => {
        if (lead.count > 0) {
            if (!publisherLeadsMap.has(lead.publisherId)) {
                publisherLeadsMap.set(lead.publisherId, []);
            }
            publisherLeadsMap.get(lead.publisherId)!.push(lead);
        }
    });

    return publishers
      .filter(p => publisherLeadsMap.has(p.id))
      .map(p => ({
        ...p,
        leads: publisherLeadsMap.get(p.id) || []
      }))
      .sort((a, b) => b.leads.reduce((sum, l) => sum + l.count, 0) - a.leads.reduce((sum, l) => sum + l.count, 0));

  }, [publishers, leads]);


  const isLoading = publishersLoading || offersLoading || leadsLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Reporte de Pago Detallado
            </h1>
            <p className="text-muted-foreground mt-2">
                Selecciona un período para ver el desglose de ganancias por editor.
            </p>
        </div>
        <div className="flex items-center gap-4">
            <MonthYearPicker
                date={currentDate}
                onDateChange={setCurrentDate}
            />
            <Button onClick={() => alert('¡Funcionalidad en desarrollo!')}>
            Exportar Reporte
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Cargando reportes...</div>
      ) : publishersWithLeads.length > 0 && offers ? (
         <div className="space-y-6">
            {publishersWithLeads.map(publisher => (
                <PublisherReportCard 
                    key={publisher.id}
                    publisher={publisher}
                    leads={publisher.leads}
                    offers={offers}
                    dateRange={dateRange!}
                />
            ))}
         </div>
      ) : (
        <div className="text-center text-muted-foreground py-10">
            No hay datos de leads para el período seleccionado.
        </div>
      )}
    </div>
  );
}
