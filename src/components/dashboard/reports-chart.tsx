'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const chartData = [
  { month: 'January', publisherA: 4000, publisherB: 2400 },
  { month: 'February', publisherA: 3000, publisherB: 1398 },
  { month: 'March', publisherA: 2000, publisherB: 9800 },
  { month: 'April', publisherA: 2780, publisherB: 3908 },
  { month: 'May', publisherA: 1890, publisherB: 4800 },
  { month: 'June', publisherA: 2390, publisherB: 3800 },
  { month: 'July', publisherA: 3490, publisherB: 4300 },
]

const chartConfig = {
  revenue: {
    label: 'Revenue',
  },
  publisherA: {
    label: 'Alpha Media',
    color: 'hsl(var(--primary))',
  },
  publisherB: {
    label: 'Beta Digital',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig

export function ReportsChart() {
  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent
                indicator="dot"
                formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number)}
              />}
            />
            <Line dataKey="publisherA" type="monotone" stroke="var(--color-publisherA)" strokeWidth={2} />
            <Line dataKey="publisherB" type="monotone" stroke="var(--color-publisherB)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
