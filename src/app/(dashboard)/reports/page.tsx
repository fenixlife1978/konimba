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
        <h1 className="text-3xl font-bold tracking-tight font-headline">Consolidated Reports</h1>
        <DateRangePicker />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Report</CardTitle>
          <CardDescription>
            A consolidated view of payments over the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsChart />
        </CardContent>
      </Card>
    </div>
  );
}
