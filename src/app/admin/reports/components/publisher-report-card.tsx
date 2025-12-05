'use client';
import type { Publisher, Lead, GlobalOffer } from '@/lib/definitions';
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
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

export const PublisherReportCard: React.FC<PublisherReportCardProps> = ({
  publisher,
  leads,
  offers,
  dateRange,
}) => {
  const initials = publisher.name?.split(' ').map((n) => n[0]).join('') || 'N/A';

  const daysInPeriod = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  }, [dateRange]);

  const { reportData, totalLeads, totalAmount } = useMemo(() => {
    const leadsByOfferAndDate: LeadsByOfferAndDate = {};
    let totalLeads = 0;
    let totalAmount = 0;

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
            totalAmount += lead.count * offer.payout;
        }
    });

    const reportData = Array.from(activeOffersInLeads).map(offerId => {
        const offer = offerMap.get(offerId);
        return {
            offerId: offerId,
            offerName: offer?.name || `Oferta ${offerId}`,
            offerPayout: offer?.payout || 0,
            dailyLeads: leadsByOfferAndDate[offerId] || {}
        };
    }).sort((a,b) => a.offerName.localeCompare(b.offerName));

    return { reportData, totalLeads, totalAmount };

  }, [leads, offers]);
  

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 bg-muted/30">
        <Avatar className="h-12 w-12">
          <AvatarImage src={publisher.avatarUrl} alt={publisher.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{publisher.name}</CardTitle>
          <CardDescription>{publisher.email}</CardDescription>
        </div>
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
                <TableHead className="text-right font-semibold pr-4">Total Leads</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.map(({ offerId, offerName, offerPayout, dailyLeads }) => {
                    const totalOfferLeads = Object.values(dailyLeads).reduce((sum, count) => sum + count, 0);
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
                            <TableCell className="text-right font-bold pr-4">{totalOfferLeads}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 flex justify-end gap-8 font-semibold">
        <div>
          <span>Leads Totales del Periodo: </span>
          <span className="text-primary">{totalLeads}</span>
        </div>
        <div>
          <span>Monto Total a Pagar: </span>
          <span className="text-primary text-lg">
            {totalAmount.toLocaleString('es-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};
