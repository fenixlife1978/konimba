'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Publisher, GlobalOffer, Lead } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PublisherReportCard } from './components/publisher-report-card';
import { startOfMonth, endOfMonth, isValid, format } from 'date-fns';
import { DatePartSelector } from './components/date-part-selector';
import { toast } from '@/hooks/use-toast';
import { ReportHeader } from './components/report-header';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Share2 } from 'lucide-react';

export default function AdminReportsPage() {
  const firestore = useFirestore();
  const [isExporting, setIsExporting] = useState(false);
  const reportsContainerRef = useRef<HTMLDivElement>(null);


  // State for the main date range used by the query
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  // Separate states for the UI selectors
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  useEffect(() => {
    // Set initial date on client-side only to prevent hydration mismatch
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    setStartDate(from);
    setEndDate(to);
    setDateRange({ from, to });
  }, []);

  const handleExport = () => {
    if (!reportsContainerRef.current) return;
    setIsExporting(true);

    html2canvas(reportsContainerRef.current, { scale: 2, backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
        hotfixes: ['px_scaling']
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const from = format(dateRange!.from, 'dd-MM-yy');
      const to = format(dateRange!.to, 'dd-MM-yy');
      pdf.save(`Reporte-KonimPay-General-${from}_${to}.pdf`);
      setIsExporting(false);
    }).catch(err => {
      console.error("Error exporting to PDF:", err);
      toast({
        variant: "destructive",
        title: "Error al Exportar",
        description: "No se pudo generar el archivo PDF."
      });
      setIsExporting(false);
    });
  };

  const handleApplyRange = () => {
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
        toast({
            variant: 'destructive',
            title: 'Fechas Inválidas',
            description: 'Por favor, asegúrate de que las fechas de inicio y fin sean válidas.',
        });
        return;
    }
    if (endDate < startDate) {
      toast({
        variant: 'destructive',
        title: 'Rango Inválido',
        description: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      });
      return;
    }
    setDateRange({ from: startDate, to: endDate });
     toast({
        title: 'Reporte Actualizado',
        description: 'Mostrando datos para el período seleccionado.',
    });
  };

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


  const isLoading = publishersLoading || offersLoading || leadsLoading || !dateRange;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Reporte de Pago Detallado
            </h1>
            <p className="text-muted-foreground mt-2">
                Selecciona un período para ver el desglose de ganancias por editor.
            </p>
        </div>
        <div className="flex flex-col items-end gap-4 p-4 border rounded-lg bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-end gap-4">
                <div className="flex flex-col items-start gap-2">
                    <label className="text-sm font-medium">Fecha de Inicio</label>
                    {startDate && (
                        <DatePartSelector 
                            date={startDate}
                            onDateChange={setStartDate}
                        />
                    )}
                </div>
                <div className="flex flex-col items-start gap-2">
                    <label className="text-sm font-medium">Fecha de Fin</label>
                    {endDate && (
                        <DatePartSelector 
                            date={endDate}
                            onDateChange={setEndDate}
                        />
                    )}
                </div>
            </div>
             <Button onClick={handleApplyRange} className="mt-2 w-full">Aplicar Período</Button>
        </div>
      </div>
      
      {publishersWithLeads.length > 0 && offers && dateRange && (
        <div className="flex justify-end mb-4">
            <Button onClick={handleExport} disabled={isExporting}>
                <Share2 className="mr-2 h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar a PDF'}
            </Button>
        </div>
      )}


      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">Cargando reportes...</div>
      ) : publishersWithLeads.length > 0 && offers && dateRange ? (
         <div ref={reportsContainerRef} className="space-y-6 bg-background p-4 rounded-lg">
            <ReportHeader />
            {publishersWithLeads.map(publisher => (
                <PublisherReportCard 
                    key={publisher.id}
                    publisher={publisher}
                    leads={publisher.leads}
                    offers={offers}
                    dateRange={dateRange}
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
