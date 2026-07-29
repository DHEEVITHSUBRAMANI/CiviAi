import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
            icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-500/40 focus:border-red-500',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500 resize-none',
          error && 'border-red-500 focus:ring-red-500/40 focus:border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
