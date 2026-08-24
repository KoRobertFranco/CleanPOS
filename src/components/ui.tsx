import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-200/80 bg-white shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[.98]',
    secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-[.98]',
    ghost: 'text-stone-600 hover:bg-stone-100 active:scale-[.98]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-[.98]',
    outline: 'border border-stone-300 text-stone-700 hover:bg-stone-50 active:scale-[.98]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
