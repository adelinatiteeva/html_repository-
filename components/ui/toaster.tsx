'use client';

import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function Toaster() {
  const { state, dismiss } = useToast();

  useEffect(() => {
    if (state.length) {
      const timer = setTimeout(() => dismiss(state[0].id), 4000);
      return () => clearTimeout(timer);
    }
  }, [state, dismiss]);

  if (!state.length) return null;

  const toast = state[0];

  return (
    <div className="fixed inset-x-0 bottom-4 flex justify-center px-4">
      <div
        className={cn(
          'w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg',
          toast.variant === 'destructive' ? 'border-destructive/50 text-destructive' : 'border-border'
        )}
      >
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        {toast.description && <p className="text-sm text-muted-foreground">{toast.description}</p>}
      </div>
    </div>
  );
}
