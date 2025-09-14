// checked
'use client';
import { useState } from 'react';
import { Info } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ChartPoint } from '@/domains/payment-health/types/chart-point';

interface ChartBlockProps {
  title: string;
  description: string;
  data: ChartPoint[];
  timeRanges: string[];
  yAxisLabel: string;
  xAxisLabel: string;
}

export default function ChartBlock({
  title,
  description,
  data,
  timeRanges,
  yAxisLabel,
  xAxisLabel,
}: ChartBlockProps) {
  const [timeRange, setTimeRange] = useState(timeRanges[0]);

  const chartConfig = {
    duration: {
      label: 'Duration (sec)',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className="grid gap-1.5">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Info className="text-muted-foreground h-4 w-4" />
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 5,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 5)}
              label={{
                value: xAxisLabel,
                position: 'insideBottom',
                offset: -15,
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="y"
              type="monotone"
              stroke="var(--color-duration)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
