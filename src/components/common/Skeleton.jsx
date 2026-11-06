import { cn } from '../../utils/cn';

export function Skeleton({ className }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

/** Placeholder shaped like an ArticleCard variant, repeated `count` times. */
export function CardSkeleton({ variant = 'row', count = 1 }) {
  const one = i => {
    if (variant === 'hero') return <Skeleton key={i} className="min-h-[200px] rounded-2xl" />;
    if (variant === 'compact') {
      return (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-[46px] shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      );
    }
    if (variant === 'grid') {
      return (
        <div key={i} className="card space-y-3 rounded-xl p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      );
    }
    return (
      <div key={i} className="card flex gap-3.5 rounded-xl px-4 py-3.5">
        <Skeleton className="h-[58px] w-[72px] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  };
  return <>{Array.from({ length: count }, (_, i) => one(i))}</>;
}
