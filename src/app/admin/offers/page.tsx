'use client';
import { OfferClient } from './components/client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { GlobalOffer } from '@/lib/definitions';

export default function AdminOffersPage() {
  const firestore = useFirestore();
  const offersRef = useMemoFirebase(() => firestore ? collection(firestore, 'global-offers') : null, [firestore]);
  const { data: offers, isLoading } = useCollection<GlobalOffer>(offersRef);

  if (isLoading) {
    return <div>Cargando catálogo de ofertas...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Catálogo de Ofertas (Global)</h1>
      <OfferClient data={offers || []} />
    </div>
  );
}
