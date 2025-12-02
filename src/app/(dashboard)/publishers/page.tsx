import { publishers } from '@/lib/data';
import type { Publisher } from '@/lib/definitions';
import { PublisherClient } from './components/client';

export default function PublishersPage() {
  const formattedPublishers: Publisher[] = publishers.map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    avatarUrl: item.avatarUrl,
    paymentMethod: item.paymentMethod,
    status: item.status,
    joiningDate: item.joiningDate,
  }));
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Editores</h1>
      <PublisherClient data={formattedPublishers} />
    </div>
  );
}
