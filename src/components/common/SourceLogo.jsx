import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-9 w-9 rounded-xl text-[11px]',
  md: 'h-10 w-10 rounded-[10px] text-[13px]',
  lg: 'h-16 w-16 rounded-2xl text-xl',
};

export default function SourceLogo({ source, size = 'md', className }) {
  return (
    <div
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center font-bold', SIZES[size], className)}
      style={{ background: source.color, color: source.textColor }}
    >
      {source.short}
    </div>
  );
}
