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
import type { GlobalOffer, Lead, Publisher, Payment } from '@/lib/definitions';
import { Timestamp } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const [stats, setStats] = React.useState({
    lastTotalPayment: 0,
    totalPublishers: 0,
    totalPayments: 0,
    pendingPayments: 0,
  });
  
  const publishersRef = useMemoFirebase(() => firestore ? collection(firestore, 'publishers') : null, [firestore]);
  const { data: publishers, isLoading: publishersLoading } = useCollection<Publisher>(publishersRef);

  const allPaymentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
  const { data: allPayments, isLoading: paymentsLoading } = useCollection<Payment>(allPaymentsRef);


  React.useEffect(() => {
    if (firestore && publishers) {
      const fetchStats = async () => {
        let totalPayments = 0;
        let pendingPayments = 0;
        let lastTotalPayment = 0;

        if (allPayments) {
            totalPayments = allPayments.length;
            pendingPayments = allPayments.filter(p => p.status === 'Pendiente').length;

            const paidPayments = allPayments.filter(p => p.status === 'Pagado' && p.paidAt);
            if (paidPayments.length > 0) {
                // Find the most recent paidAt date
                const mostRecentPaidAt = paidPayments.reduce((latest, p) => {
                    const pDate = (p.paidAt as Timestamp).toDate();
                    return pDate > latest ? pDate : latest;
                }, new Date(0));
                
                // Filter payments made on that most recent date (day)
                const lastBatchOfPayments = paidPayments.filter(p => {
                    const pDate = (p.paidAt as Timestamp).toDate();
                    return pDate.getFullYear() === mostRecentPaidAt.getFullYear() &&
                           pDate.getMonth() === mostRecentPaidAt.getMonth() &&
                           pDate.getDate() === mostRecentPaidAt.getDate();
                });

                // Sum the amount of that last batch
                lastTotalPayment = lastBatchOfPayments.reduce((acc, p) => acc + p.amount, 0);
            }
        }


        setStats({
          lastTotalPayment,
          totalPublishers: publishers.length,
          totalPayments,
          pendingPayments,
        });
      };

      fetchStats();
    }
  }, [firestore, publishers, allPayments]);

  const isLoading = publishersLoading || paymentsLoading;

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold tracking-tight font-headline">Panel de Administrador</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Pago Total Realizado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="text-2xl font-bold">Calculando...</div>
             ) : (
                <div className="text-2xl font-bold">
                ${stats.lastTotalPayment.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
             )}
            <p className="text-xs text-muted-foreground">
              Suma del último lote de pagos procesado.
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
              Esperando procesamiento
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
