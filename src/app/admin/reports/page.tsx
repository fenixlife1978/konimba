'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Publisher, GlobalOffer, Lead, CompanyProfile } from '@/lib/definitions';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PublisherReportCard } from './components/publisher-report-card';
import { startOfMonth, endOfMonth, isValid, format, eachDayOfInterval } from 'date-fns';
import { DatePartSelector } from './components/date-part-selector';
import { toast } from '@/hooks/use-toast';
import { ReportHeader } from './components/report-header';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Share2 } from 'lucide-react';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function AdminReportsPage() {
  const firestore = useFirestore();
  const [isExporting, setIsExporting] = useState(false);
  const reportsContainerRef = useRef<HTMLDivElement>(null);
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
  const { data: companyProfile } = useDoc<CompanyProfile>(settingsRef);

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
      if (!dateRange || !publishersWithLeads || !offers || !companyProfile) {
          toast({ variant: 'destructive', title: 'Error', description: 'Datos insuficientes para generar el reporte.' });
          return;
      }
      setIsExporting(true);

      const doc = new jsPDF({ orientation: 'landscape' }) as jsPDFWithAutoTable;

      const addHeader = () => {
          if (companyProfile.logoUrl) {
            try {
              // Ensure the logo is a data URL
              if(companyProfile.logoUrl.startsWith('data:image')){
                 doc.addImage(companyProfile.logoUrl, 'PNG', 15, 10, 30, 15, undefined, 'FAST');
              }
            } catch(e) {
                console.error("Could not add image to PDF", e);
            }
          }
          doc.setFontSize(18);
          doc.text(companyProfile.name, doc.internal.pageSize.getWidth() - 15, 15, { align: 'right' });
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(companyProfile.address, doc.internal.pageSize.getWidth() - 15, 20, { align: 'right' });
          doc.text(`Tel: ${companyProfile.phone} - ${companyProfile.country}`, doc.internal.pageSize.getWidth() - 15, 24, { align: 'right' });
      };

      const addTitle = () => {
        doc.setFontSize(14);
        doc.text('Reporte de Pago Detallado', 15, 40);
        doc.setFontSize(10);
        doc.setTextColor(100);
        const period = `Período: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
        doc.text(period, 15, 45);
      }

      let yPos = 55;

      const daysInPeriod = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const dayHeaders = daysInPeriod.map(day => format(day, 'dd'));

      publishersWithLeads.forEach((publisher, index) => {
          
          if (index > 0) { // Add space between publisher sections
            yPos = (doc as any).autoTable.previous.finalY + 15;
          }

          if(yPos > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            yPos = 30; // Reset Y position for new page
            addHeader();
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${publisher.name}`, 15, yPos);
          yPos += 2;

          const offerMap = new Map(offers.map(o => [o.id, o]));
          const leadsByOfferAndDate: { [key: string]: { [key: string]: number } } = {};
          
          publisher.leads.forEach(lead => {
              if (lead.count > 0 && offerMap.has(lead.offerId)) {
                  const dateStr = format((lead.date as any).toDate(), 'yyyy-MM-dd');
                  if (!leadsByOfferAndDate[lead.offerId]) leadsByOfferAndDate[lead.offerId] = {};
                  leadsByOfferAndDate[lead.offerId][dateStr] = lead.count;
              }
          });

          const body = Object.keys(leadsByOfferAndDate).map(offerId => {
              const offer = offerMap.get(offerId)!;
              const dailyLeads = leadsByOfferAndDate[offerId] || {};
              const totalOfferLeads = Object.values(dailyLeads).reduce((sum, count) => sum + count, 0);
              const subtotal = totalOfferLeads * offer.payout;

              const rowData = [
                  offer.name,
                  `$${offer.payout.toFixed(2)}`,
                  ...daysInPeriod.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      return dailyLeads[dateStr] || '-';
                  }),
                  totalOfferLeads,
                  `$${subtotal.toFixed(2)}`
              ];
              return rowData;
          });

          const totalPublisherLeads = publisher.leads.reduce((sum, l) => sum + l.count, 0);
          const totalPublisherAmount = body.reduce((sum, row) => sum + parseFloat((row.at(-1) as string).replace('$', '')), 0);
          
          const footerContent = [
            { content: 'Total a Pagar', colSpan: daysInPeriod.length + 2, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: totalPublisherLeads, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: `$${totalPublisherAmount.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } },
          ];

          doc.autoTable({
              startY: yPos,
              head: [['Oferta', 'Valor', ...dayHeaders, 'Total Leads', 'Sub Total']],
              body: body,
              foot: [footerContent],
              theme: 'striped',
              headStyles: { fillColor: [0, 112, 74], fontSize: 7, halign: 'center' },
              footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
              bodyStyles: { fontSize: 8 },
              columnStyles: {
                  0: { cellWidth: 40 }, // Offer Name
                  1: { halign: 'right' }, // Payout
                  [dayHeaders.length + 2]: { halign: 'center', fontStyle: 'bold' }, // Total Leads
                  [dayHeaders.length + 3]: { halign: 'right', fontStyle: 'bold' }, // Sub Total
              },
              didDrawPage: (data) => {
                  if(data.pageNumber === 1) {
                    addHeader();
                    addTitle();
                  } else {
                    addHeader();
                  }
              },
              margin: { top: 50 }
          });
          
      });

      const from = format(dateRange.from, 'dd-MM-yy');
      const to = format(dateRange.to, 'dd-MM-yy');
      doc.save(`Reporte-KonimPay-General-${from}_${to}.pdf`);
      setIsExporting(false);
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
