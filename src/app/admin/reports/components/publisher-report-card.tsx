'use client';
import type { Publisher, Lead, GlobalOffer, CompanyProfile } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as UiTableFooter,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo, useRef } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { KonimPayLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PublisherReportCardProps {
  publisher: Publisher;
  leads: Lead[];
  offers: GlobalOffer[];
  dateRange: { from: Date; to: Date };
}

type LeadsByOfferAndDate = {
  [offerId: string]: {
    [date: string]: number;
  };
};

const ReportHeader = () => {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
    const { data: companyProfile } = useDoc<CompanyProfile>(settingsRef);
    
    return (
        <div className="flex items-center justify-between p-4 bg-muted/20 border-b">
            <div className="h-12 w-32 relative">
                <KonimPayLogo />
            </div>
            {companyProfile && (
                <div className="text-right text-xs text-muted-foreground">
                    <p className="font-bold text-sm text-foreground">{companyProfile.name}</p>
                    <p>{companyProfile.address}</p>
                    <p>Tel: {companyProfile.phone} - {companyProfile.country}</p>
                </div>
            )}
        </div>
    )
}

export const PublisherReportCard: React.FC<PublisherReportCardProps> = ({
  publisher,
  leads,
  offers,
  dateRange,
}) => {
  const initials = publisher.name?.split(' ').map((n) => n[0]).join('') || 'N/A';
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (!reportRef.current) return;

    html2canvas(reportRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const from = format(dateRange.from, 'dd-MM-yy');
      const to = format(dateRange.to, 'dd-MM-yy');
      pdf.save(`Reporte-KonimPay-${publisher.name}-${from}_${to}.pdf`);
    });
  };

  const daysInPeriod = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  }, [dateRange]);

  const { reportData, totalLeads, totalAmount } = useMemo(() => {
    const leadsByOfferAndDate: LeadsByOfferAndDate = {};
    let totalLeads = 0;

    const offerMap = new Map(offers.map(o => [o.id, o]));
    const activeOffersInLeads = new Set<string>();

    leads.forEach((lead) => {
        if (lead.count > 0) {
            const offer = offerMap.get(lead.offerId);
            if (!offer) return;

            activeOffersInLeads.add(lead.offerId);
            const dateStr = format( (lead.date as any).toDate(), 'yyyy-MM-dd' );

            if (!leadsByOfferAndDate[lead.offerId]) {
                leadsByOfferAndDate[lead.offerId] = {};
            }
            leadsByOfferAndDate[lead.offerId][dateStr] = lead.count;
            
            totalLeads += lead.count;
        }
    });

    const reportData = Array.from(activeOffersInLeads).map(offerId => {
        const offer = offerMap.get(offerId);
        const dailyLeads = leadsByOfferAndDate[offerId] || {};
        const totalOfferLeads = Object.values(dailyLeads).reduce((sum, count) => sum + count, 0);
        const subtotal = totalOfferLeads * (offer?.payout || 0);

        return {
            offerId: offerId,
            offerName: offer?.name || `Oferta ${offerId}`,
            offerPayout: offer?.payout || 0,
            dailyLeads: dailyLeads,
            totalOfferLeads: totalOfferLeads,
            subtotal: subtotal
        };
    }).sort((a,b) => a.offerName.localeCompare(b.offerName));

    const totalAmount = reportData.reduce((sum, item) => sum + item.subtotal, 0);

    return { reportData, totalLeads, totalAmount };

  }, [leads, offers]);
  

  return (
    <Card className="overflow-hidden" ref={reportRef}>
      <ReportHeader />
      <CardHeader className="flex flex-row items-center justify-between gap-4 bg-muted/30">
        <div className='flex items-center gap-4'>
            <Avatar className="h-12 w-12">
              <AvatarImage src={publisher.avatarUrl} alt={publisher.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{publisher.name}</CardTitle>
              <CardDescription>{publisher.email}</CardDescription>
            </div>
        </div>
        <Button onClick={handleExport} variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Exportar a PDF</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full whitespace-nowrap">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 w-[200px] font-semibold">
                    Oferta
                </TableHead>
                <TableHead className="text-right">Valor (USD)</TableHead>
                {daysInPeriod.map((day) => (
                    <TableHead key={day.toISOString()} className="text-center text-xs px-2">
                        {format(day, 'dd')}
                    </TableHead>
                ))}
                <TableHead className="text-right font-semibold">Total Leads</TableHead>
                <TableHead className="text-right font-semibold pr-4">Sub Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.map(({ offerId, offerName, offerPayout, dailyLeads, totalOfferLeads, subtotal }) => {
                    return (
                        <TableRow key={offerId}>
                            <TableCell className="sticky left-0 bg-card z-10 font-medium truncate max-w-[200px]">
                                {offerName}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {offerPayout.toLocaleString('es-US', { style: 'currency', currency: 'USD' })}
                            </TableCell>
                            {daysInPeriod.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const count = dailyLeads[dateStr] || 0;
                                return (
                                    <TableCell key={dateStr} className={`text-center px-2 ${count > 0 ? 'font-bold' : 'text-muted-foreground'}`}>
                                        {count > 0 ? count : '-'}
                                    </TableCell>
                                );
                            })}
                            <TableCell className="text-right font-bold">{totalOfferLeads}</TableCell>
                             <TableCell className="text-right font-mono text-sm font-semibold pr-4">
                              {subtotal.toLocaleString('es-US', { style: 'currency', currency: 'USD' })}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
             <UiTableFooter>
                <TableRow>
                    <TableCell colSpan={daysInPeriod.length + 3} className="text-right font-bold text-lg">Total a Pagar</TableCell>
                    <TableCell className="text-right font-bold text-lg">{totalLeads}</TableCell>
                    <TableCell className="text-right font-bold text-lg pr-4">
                        {totalAmount.toLocaleString('es-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                </TableRow>
            </UiTableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
