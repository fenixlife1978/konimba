'use client';
import { useState, useMemo } from 'react';
import type { Publisher, GlobalOffer, Lead } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LeadGridProps {
  publishers: Publisher[];
  offers: GlobalOffer[];
  leads: Lead[];
  date: Date;
  onLeadChange: (publisherId: string, offerId: string, count: number, leadId?: string) => void;
}

export const LeadGrid: React.FC<LeadGridProps> = ({
  publishers,
  offers,
  leads,
  date,
  onLeadChange,
}) => {
  // Memoize leads for the active date for performance
  const leadsForDate = useMemo(() => {
    const targetDateString = date.toISOString().split('T')[0];
    return leads.filter(lead => {
        const leadDate = lead.date instanceof Date ? lead.date : (lead.date as any).toDate();
        return leadDate.toISOString().split('T')[0] === targetDateString;
    });
  }, [leads, date]);

  // Create a map for quick lookup: 'publisherId_offerId' -> {count, id}
  const leadsMap = useMemo(() => {
    const map = new Map<string, { count: number; id: string }>();
    leadsForDate.forEach(lead => {
      map.set(`${lead.publisherId}_${lead.offerId}`, { count: lead.count, id: lead.id });
    });
    return map;
  }, [leadsForDate]);


  const handleInputChange = (publisherId: string, offerId: string, value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0) {
      const existingLead = leadsMap.get(`${publisherId}_${offerId}`);
      onLeadChange(publisherId, offerId, count, existingLead?.id);
    } else if (value === '') {
        const existingLead = leadsMap.get(`${publisherId}_${offerId}`);
        onLeadChange(publisherId, offerId, 0, existingLead?.id);
    }
  };

  return (
    <Card>
      <ScrollArea className="w-full whitespace-nowrap">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card z-10 w-[250px]">
                Publisher
              </TableHead>
              {offers.map(offer => (
                <TableHead key={offer.id} className="text-center">
                  <div className="flex justify-center items-end h-full">
                    <span
                      className="writing-mode-vertical-rl rotate-180 text-xs font-semibold whitespace-nowrap"
                      style={{ writingMode: 'vertical-rl' }}
                    >
                      {offer.name}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishers.map(publisher => (
              <TableRow key={publisher.id}>
                <TableCell className="sticky left-0 bg-card z-10 font-medium w-[250px]">
                  {publisher.name}
                </TableCell>
                {offers.map(offer => {
                    const leadInfo = leadsMap.get(`${publisher.id}_${offer.id}`);
                    return (
                        <TableCell key={`${publisher.id}-${offer.id}`} className="p-1">
                            <Input
                            type="number"
                            className="w-20 text-center"
                            placeholder="0"
                            defaultValue={leadInfo?.count || ''}
                            onChange={(e) => handleInputChange(publisher.id, offer.id, e.target.value)}
                            />
                        </TableCell>
                    );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
};
