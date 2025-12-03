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
import { useCollection } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import React from 'react';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalPublishers: 0,
    totalPayments: 0,
    pendingPayments: 0,
  });
  
  const publishersRef = useMemoFirebase(() => firestore ? collection(firestore, 'publishers') : null, [firestore]);
  const { data: publishers, isLoading: publishersLoading } = useCollection(publishersRef);

  React.useEffect(() => {
    if (firestore && publishers) {
      const fetchStats = async () => {
        let totalRevenue = 0;
        let totalPayments = 0;
        let pendingPayments = 0;

        for (const publisher of publishers) {
          const paymentsRef = collection(firestore, 'publishers', publisher.id, 'payments');
          const paymentsSnapshot = await getDocs(paymentsRef);
          paymentsSnapshot.forEach(doc => {
            const payment = doc.data();
            totalRevenue += payment.amount;
            totalPayments++;
            if (payment.status === 'Pendiente') {
              pendingPayments++;
            }
          });
        }

        setStats({
          totalRevenue,
          totalPublishers: publishers.length,
          totalPayments,
          pendingPayments,
        });
      };

      fetchStats();
    }
  }, [firestore, publishers]);

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold tracking-tight font-headline">Panel de Administrador</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              De todos los editores
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
            <CardTitle className="text-sm font-medium">Pagos Totales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Procesados en el sistema
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
