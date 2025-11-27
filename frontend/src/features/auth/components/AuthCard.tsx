import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type AuthCardProps = PropsWithChildren<{
  className?: string;
}>;

export function AuthCard({ className, children }: AuthCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-8 shadow-xl', className)}>
      {children}
    </div>
  );
}

