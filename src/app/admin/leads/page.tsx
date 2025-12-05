'use client';
import type { Lead, GlobalOffer, Publisher } from '@/lib/definitions';
import { LeadClient } from './components/client';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function AdminLeadsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const leadsRef = useMemoFirebase(() => firestore && user ? collection(firestore, 'leads') : null, [firestore, user]);
  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsRef);
  
  const offersRef = useMemoFirebase(() => firestore && user ? collection(firestore, 'global-offers') : null, [firestore, user]);
  const { data: offers, isLoading: offersLoading } = useCollection<GlobalOffer>(offersRef);

  const publishersRef = useMemoFirebase(() => firestore && user ? collection(firestore, 'publishers') : null, [firestore, user]);
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
