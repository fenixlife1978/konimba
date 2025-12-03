'use client';
import type { Publisher } from '@/lib/definitions';
import { PublisherClient } from '@/app/(dashboard)/publishers/components/client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function AdminPublishersPage() {
  const firestore = useFirestore();
  const publishersRef = useMemoFirebase(() => firestore ? collection(firestore, 'publishers') : null, [firestore]);
  const { data: publishers, isLoading } = useCollection<Publisher>(publishersRef);

  if (isLoading) {
    return <div>Cargando editores...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Editores (Global)</h1>
      <PublisherClient data={publishers || []} />
    </div>
  );
}
