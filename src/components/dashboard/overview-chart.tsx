'use client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const data = [
  { name: 'Ene', total: 1100 },
  { name: 'Feb', total: 2800 },
  { name: 'Mar', total: 1500 },
  { name: 'Abr', total: 3200 },
  { name: 'May', total: 1800 },
  { name: 'Jun', total: 4500 },
  { name: 'Jul', total: 2600 },
  { name: 'Ago', total: 3900 },
  { name: 'Sep', total: 2100 },
  { name: 'Oct', total: 4200 },
  { name: 'Nov', total: 2400 },
  { name: 'Dic', total: 4900 },
];

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function OverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full" id="overview-chart">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
              cursor={{fill: 'hsl(var(--secondary))'}}
              content={<ChartTooltipContent
                  formatter={(value) => `$${value.toLocaleString()}`}
                  indicator="dot"
              />}
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
