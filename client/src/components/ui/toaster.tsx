import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { useEffect } from 'react';

// Simple toast component that can be replaced with a more sophisticated one later
export function Toaster() {
  const { toasts, dismiss } = useToast();

  // Add escape key listener to dismiss all toasts
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dismiss]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right-5 ${
            toast.variant === 'destructive'
              ? 'bg-destructive text-destructive-foreground'
              : toast.variant === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-background border'
          }`}
        >
          <div className="flex-1">
            {toast.title && (
              <div className="font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="p-1 rounded-md transition-colors hover:bg-secondary"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      ))}
    </div>
  );
}