// checked
'use client';
import { CheckCircle2, XCircle } from 'lucide-react';

function StatusIndicator({ status }: { status: string }) {
  if (status === 'success') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <CheckCircle2 className="h-5 w-5 fill-green-100 text-green-500" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <XCircle className="h-5 w-5 fill-red-100 text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-muted-foreground text-sm">Text</span>
    </div>
  );
}

export default StatusIndicator;
