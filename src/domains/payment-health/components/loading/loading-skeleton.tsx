// checked
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  className?: string;
}

export function ButtonLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <Skeleton className="h-6 w-12 rounded" />
      <Skeleton className="h-6 w-12 rounded" />
      <Skeleton className="h-6 w-16 rounded" />
    </div>
  );
}

export function CardLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg border-2 border-gray-200 bg-gray-50 p-2 ${className}`}
    >
      <div className="p-2">
        <Skeleton className="mb-1 h-3 w-20" />
        <Skeleton className="h-2 w-16" />
      </div>
      <div className="p-2 pt-0">
        <ButtonLoadingSkeleton />
      </div>
    </div>
  );
}
