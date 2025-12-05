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
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const publishersRef = useMemoFirebase(() => firestore && user ? collection(firestore, 'publishers') : null, [firestore, user]);
  const { data: publishers } = useCollection(publishersRef);

  const paymentsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'publishers', user.uid, 'payments')) : null, [firestore, user]);
  const { data: payments } = useCollection(paymentsQuery);

  const totalRevenue = payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const totalPublishers = publishers?.length || 0;
  const totalPayments = payments?.length || 0;
  
  // TODO: Add status to payment to calculate pending payments
  const pendingPayments = 0;


  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <div className="text-2xl font-bold">+{totalPublishers}</div>
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
            <div className="text-2xl font-bold">+{totalPayments}</div>
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
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Esperando procesamiento
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
