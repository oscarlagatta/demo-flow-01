// checked
import { ButtonHTMLAttributes, ReactNode } from 'react';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface LoadingButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'variant'> {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
  variant?:
    | 'outline'
    | 'default'
    | 'destructive'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  children,
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'w-full transition-all duration-200',
        isLoading && 'cursor-not-allowed opacity-70',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          <span className="text-[10px]">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
