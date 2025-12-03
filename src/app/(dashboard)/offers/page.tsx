'use client'
import { OfferClient } from './components/client';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function OffersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const offersQuery = useMemoFirebase(() => user ? query(collection(firestore, 'publishers', user.uid, 'offers')) : null, [firestore, user]);
  const { data: offers, isLoading } = useCollection(offersQuery);

  if (isLoading) {
    return <div>Cargando ofertas...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Ofertas y Campañas</h1>
      <OfferClient data={offers || []} />
    </div>
  );
}
