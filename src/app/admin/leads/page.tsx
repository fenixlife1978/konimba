'use client';
import type { Lead, GlobalOffer, Publisher } from '@/lib/definitions';
import { LeadClient } from './components/client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

export default function AdminLeadsPage() {
  const firestore = useFirestore();

  const leadsRef = useMemoFirebase(() => firestore ? collection(firestore, 'leads') : null, [firestore]);
  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsRef);
  
  const offersRef = useMemoFirebase(() => firestore ? collection(firestore, 'global-offers') : null, [firestore]);
  const { data: offers, isLoading: offersLoading } = useCollection<GlobalOffer>(offersRef);

  const publishersRef = useMemoFirebase(() => firestore ? collection(firestore, 'publishers') : null, [firestore]);
  const { data: publishers, isLoading: publishersLoading } = useCollection<Publisher>(publishersRef);

  const isLoading = leadsLoading || offersLoading || publishersLoading;
  
  if (isLoading) {
    return <div>Cargando datos de leads...</div>;
  }

  // Enrich leads data with publisher and offer names for display
  const enrichedLeads = leads?.map(lead => {
    const publisher = publishers?.find(p => p.id === lead.publisherId);
    const offer = offers?.find(o => o.id === lead.offerId);
    return {
      ...lead,
      publisherName: publisher?.name || 'Desconocido',
      offerName: offer?.name || 'Desconocido',
    };
  }) || [];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Gestión de Leads</h1>
      <LeadClient 
        data={enrichedLeads}
        publishers={publishers || []}
        offers={offers || []}
      />
    </div>
  );
}
