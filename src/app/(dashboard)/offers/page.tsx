import { offers } from '@/lib/data';
import type { Offer } from '@/lib/definitions';
import { OfferClient } from './components/client';

export default function OffersPage() {
  const formattedOffers: Offer[] = offers.map(item => ({
    id: item.id,
    name: item.name,
    payout: item.payout,
    status: item.status,
  }));
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Ofertas y Campañas</h1>
      <OfferClient data={formattedOffers} />
    </div>
  );
}
