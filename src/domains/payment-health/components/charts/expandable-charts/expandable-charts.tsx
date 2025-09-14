// checked
'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceCharts } from '@/domains/payment-health/hooks/hooks';
import ChartBlock from '@/domains/payment-health/components/charts/chart-block/chart-block';

export default function ExpandableCharts(props: any) {
  const serviceId = props.data.id;
  const { data: chartData, isLoading } = useServiceCharts(serviceId);

  if (isLoading) {
    return (
      <div className="grid h-full gap-4 bg-gray-50 p-4 md:grid-cols-2">
        <Skeleton className="h-full w-full" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="grid h-full gap-4 bg-gray-50 p-4 md:grid-cols-2">
      <ChartBlock
        title="Average Transaction Duration"
        description="The Average Time to complete a transaction in the last 7 Days is 10 seconds"
        data={chartData?.averageTransactionDuration || []}
        timeRanges={['Last 7 Days', 'Last 14 Days', 'Last 30 Days']}
        yAxisLabel="Time in seconds"
        xAxisLabel="Days"
      />
      <ChartBlock
        title="Current Hourly Average Today"
        description="The Current Hourly Average to complete a transaction today is 3 seconds"
        data={chartData?.currentHourlyAverage || []}
        timeRanges={['Today', 'Yesterday']}
        yAxisLabel="Time in seconds"
        xAxisLabel="Time of the day"
      />
    </div>
  );
}
