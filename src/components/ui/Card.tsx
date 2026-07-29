import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl',
        hover && 'transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 border-b border-gray-200 dark:border-gray-800', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-display font-semibold text-lg text-gray-900 dark:text-gray-100', className)} {...props}>
      {children}
    </h3>
  );
}
