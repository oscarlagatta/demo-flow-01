'use client';

import { Info, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InfoSectionProps {
  time?: number;
}

export function InfoSection({ time = 0 }: InfoSectionProps) {
  const getPerformanceStatus = (totalTime: number) => {
    if (totalTime <= 5)
      return { status: 'excellent', color: 'green', icon: TrendingUp };
    if (totalTime <= 15) return { status: 'good', color: 'blue', icon: Clock };
    if (totalTime <= 30)
      return { status: 'warning', color: 'yellow', icon: AlertTriangle };
    return { status: 'critical', color: 'red', icon: AlertTriangle };
  };

  const performance = getPerformanceStatus(time);
  const StatusIcon = performance.icon;

  const getStatusStyles = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getIconStyles = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600';
      case 'blue':
        return 'text-blue-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <Card className={`${getStatusStyles(performance.color)} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Info className={`h-5 w-5 ${getIconStyles(performance.color)}`} />
              <span className="text-sm font-medium">
                The Total Average Processing Time for transactions in the US is
              </span>
            </div>
            <div
              className={`flex items-center space-x-2 rounded-full border px-3 py-1 ${getBadgeStyles(performance.color)}`}
            >
              <StatusIcon className="h-4 w-4" />
              <span className="text-lg font-bold">{time} seconds</span>
            </div>
          </div>

          <div className="text-xs font-medium capitalize opacity-75">
            {performance.status} Performance
          </div>
        </div>

        <div className="mt-2 text-xs opacity-60">
          View individual section timing in the flow diagram headers above
        </div>
      </CardContent>
    </Card>
  );
}
