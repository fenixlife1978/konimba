'use client';
import type { Publisher, Lead, GlobalOffer, CompanyProfile } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useMemo } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface PublisherReportCardProps {
  publisher: Publisher;
  leads: Lead[];
  offers: GlobalOffer[];
  dateRange: { from: Date; to: Date };
  companyProfile: CompanyProfile | null;
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
  companyProfile,
}) => {
  const initials = publisher.name?.split(' ').map((n) => n[0]).join('') || 'N/A';

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

  const isLocalPayment = publisher.paymentMethod === 'Bolivares' || publisher.paymentMethod === 'Pesos Colombianos';
  const exchangeRate = publisher.paymentMethod === 'Bolivares' 
    ? companyProfile?.usdToVesRate 
    : publisher.paymentMethod === 'Pesos Colombianos'
    ? companyProfile?.usdToCopRate
    : null;
  const localAmount = exchangeRate ? totalAmount * exchangeRate : 0;
  const localCurrency = publisher.paymentMethod === 'Bolivares' ? 'VES' : 'COP';
  const localCurrencySymbol = publisher.paymentMethod === 'Bolivares' ? 'Bs.' : 'COP';
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4 bg-muted/30">
        <div className='flex items-center gap-4'>
            <Avatar className="h-12 w-12">
              <AvatarImage src={publisher.avatarUrl} alt={publisher.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{publisher.name}</CardTitle>
              <CardDescription>{publisher.email} - ({publisher.paymentMethod})</CardDescription>
            </div>
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
                    <TableCell colSpan={daysInPeriod.length + 2} className="text-right font-bold text-lg">Total a Pagar (USD)</TableCell>
                    <TableCell className="text-right font-bold">{totalLeads}</TableCell>
                    <TableCell className="text-right font-bold text-lg pr-4">
                        {totalAmount.toLocaleString('es-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                </TableRow>
                {isLocalPayment && exchangeRate && (
                  <TableRow>
                      <TableCell colSpan={daysInPeriod.length + 2} className="text-right font-medium text-muted-foreground">
                          Conversión a {localCurrency} (Tasa: {exchangeRate.toLocaleString()})
                      </TableCell>
                      <TableCell colSpan={2} className="text-right font-bold text-lg pr-4">
                          {localAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {localCurrencySymbol}
                      </TableCell>
                  </TableRow>
                )}
            </UiTableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
