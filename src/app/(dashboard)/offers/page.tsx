import { offers } from '@/lib/data';
import type { Offer } from '@/lib/definitions';
import { OfferClient } from './components/client';

export default function OffersPage() {
  const formattedOffers: Offer[] = offers.map(item => ({
    id: item.id,
    name: item.name,
    platform: item.platform,
    payout: item.payout,
    status: item.status,
    startDate: item.startDate,
  }));
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Offers & Campaigns</h1>
      <OfferClient data={formattedOffers} />
    </div>
  );
}
