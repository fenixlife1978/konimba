import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReportsChart } from '@/components/dashboard/reports-chart';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Informes Consolidados</h1>
        <DateRangePicker />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informe de Pagos</CardTitle>
          <CardDescription>
            Una vista consolidada de los pagos durante el período seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsChart />
        </CardContent>
      </Card>
    </div>
  );
}
