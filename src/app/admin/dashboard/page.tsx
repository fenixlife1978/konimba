'use client';
import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import React from 'react';
import type { GlobalOffer, Lead, Publisher } from '@/lib/definitions';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const [stats, setStats] = React.useState({
    totalPaymentForPeriod: 0,
    totalPublishers: 0,
    totalPayments: 0,
    pendingPayments: 0,
  });
  
  const publishersRef = useMemoFirebase(() => firestore ? collection(firestore, 'publishers') : null, [firestore]);
  const { data: publishers, isLoading: publishersLoading } = useCollection<Publisher>(publishersRef);

  const leadsRef = useMemoFirebase(() => firestore ? collection(firestore, 'leads') : null, [firestore]);
  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsRef);

  const offersRef = useMemoFirebase(() => firestore ? collection(firestore, 'global-offers') : null, [firestore]);
  const { data: offers, isLoading: offersLoading } = useCollection<GlobalOffer>(offersRef);

  React.useEffect(() => {
    if (firestore && publishers && leads && offers) {
      const fetchStats = async () => {
        let totalPayments = 0;
        let pendingPayments = 0;
        let totalPaymentForPeriod = 0;

        // Calculate total payment for the current period based on leads
        if (leads && offers) {
            totalPaymentForPeriod = leads.reduce((acc, lead) => {
                const offer = offers.find(o => o.id === lead.offerId);
                if (offer && offer.payout) {
                    return acc + (lead.count * offer.payout);
                }
                return acc;
            }, 0);
        }

        if (publishers && firestore) {
          for (const publisher of publishers) {
            const paymentsRef = collection(firestore, 'publishers', publisher.id, 'payments');
            const paymentsSnapshot = await getDocs(paymentsRef);
            paymentsSnapshot.forEach(doc => {
              const payment = doc.data();
              totalPayments++;
              if (payment.status === 'Pendiente') {
                pendingPayments++;
              }
            });
          }
        }


        setStats({
          totalPaymentForPeriod,
          totalPublishers: publishers.length,
          totalPayments,
          pendingPayments,
        });
      };

      fetchStats();
    }
  }, [firestore, publishers, leads, offers]);

  const isLoading = publishersLoading || leadsLoading || offersLoading;

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold tracking-tight font-headline">Panel de Administrador</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago Global del Período</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="text-2xl font-bold">Calculando...</div>
             ) : (
                <div className="text-2xl font-bold">
                ${stats.totalPaymentForPeriod.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
             )}
            <p className="text-xs text-muted-foreground">
              Total a pagar basado en leads cargados.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalPublishers}</div>
            <p className="text-xs text-muted-foreground">
              Actualmente activos e inactivos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Históricos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Total de pagos procesados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              De períodos anteriores
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Resumen General</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
