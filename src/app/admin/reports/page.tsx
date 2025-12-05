'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Publisher, GlobalOffer, Lead } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PublisherReportCard } from './components/publisher-report-card';
import { startOfMonth, endOfMonth } from 'date-fns';
import { MonthYearPicker } from './components/month-year-picker';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { DateRange } from 'react-day-picker';

export default function AdminReportsPage() {
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  });

  useEffect(() => {
    if (!isCustomRange) {
      setDateRange({
          from: startOfMonth(currentDate),
          to: endOfMonth(currentDate)
      });
    }
  }, [currentDate, isCustomRange]);

  const handleCustomRangeApply = () => {
      if (customDateRange?.from && customDateRange?.to) {
          setIsCustomRange(true);
          setDateRange({ from: customDateRange.from, to: customDateRange.to });
      }
  }
  
  const handleMonthYearChange = (date: Date) => {
    setIsCustomRange(false);
    setCurrentDate(date);
  }


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
        <div className="flex items-center gap-2">
            <MonthYearPicker
                date={currentDate}
                onDateChange={handleMonthYearChange}
                disabled={isCustomRange}
            />
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">Período Personalizado</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Seleccionar un rango de fechas</DialogTitle>
                    </DialogHeader>
                    <DateRangePicker onDateChange={setCustomDateRange} />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button onClick={handleCustomRangeApply}>Aplicar Rango</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
