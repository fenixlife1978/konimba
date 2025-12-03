'use client';
import { OfferClient } from '@/app/(dashboard)/offers/components/client';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Offer, Publisher } from '@/lib/definitions';

export default function AdminOffersPage() {
  const firestore = useFirestore();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!firestore) return;
      setIsLoading(true);

      // Fetch Publishers
      const publishersSnapshot = await getDocs(collection(firestore, 'publishers'));
      const publishersData = publishersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Publisher));
      setPublishers(publishersData);

      // Fetch Offers for each publisher
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

    fetchAllData();
  }, [firestore]);

  if (isLoading) {
    return <div>Cargando datos globales...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Ofertas y Campañas (Global)</h1>
      <OfferClient data={allOffers} publishers={publishers} />
    </div>
  );
}
