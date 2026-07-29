import { cn } from '../../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin h-5 w-5 text-brand-600', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-brand-200 dark:border-brand-900" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-brand-600 animate-spin" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: {
  icon: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{message}</p>}
      {action}
    </div>
  );
}
