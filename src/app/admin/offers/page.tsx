'use client';
import { OfferClient } from '@/app/(dashboard)/offers/components/client';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Offer } from '@/lib/definitions';

export default function AdminOffersPage() {
  const firestore = useFirestore();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllOffers = async () => {
      if (!firestore) return;
      setIsLoading(true);
      const publishersSnapshot = await getDocs(collection(firestore, 'publishers'));
      const offersPromises = publishersSnapshot.docs.map(pubDoc => {
        const offersRef = collection(firestore, 'publishers', pubDoc.id, 'offers');
        return getDocs(offersRef);
      });

      const offerSnapshots = await Promise.all(offersPromises);
      const offers: Offer[] = [];
      offerSnapshots.forEach(offerSnapshot => {
        offerSnapshot.forEach(doc => {
          offers.push({ id: doc.id, ...doc.data() } as Offer);
        });
      });
      
      setAllOffers(offers);
      setIsLoading(false);
    };

    fetchAllOffers();
  }, [firestore]);

  if (isLoading) {
    return <div>Cargando ofertas globales...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Ofertas y Campañas (Global)</h1>
      <OfferClient data={allOffers} />
    </div>
  );
}
