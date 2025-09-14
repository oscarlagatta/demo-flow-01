// checked
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SectionDurationBadgeProps {
  duration: number;
  sectionName: string;
  className?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function SectionDurationBadge({
  duration,
  sectionName,
  className,
  trend = 'stable',
}: SectionDurationBadgeProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    return `${seconds.toFixed(1)}s`;
  };

  const getDurationColor = (seconds: number) => {
    if (seconds < 1) return 'text-green-600 bg-green-50 border-green-200';
    if (seconds < 3) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium',
        'shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md',
        getDurationColor(duration),
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span className="font-mono">Avg: {formatDuration(duration)}</span>
      <span className="text-xs opacity-70">{getTrendIcon()}</span>
    </div>
  );
}

export { SectionDurationBadge };
