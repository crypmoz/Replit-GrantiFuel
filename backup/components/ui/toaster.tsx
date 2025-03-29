import React from 'react';
import { useToast } from '../../hooks/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md max-w-md transform transition-all duration-300 ${
            toast.variant === 'destructive'
              ? 'bg-red-100 border-l-4 border-red-500 text-red-700'
              : toast.variant === 'success'
              ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
              : 'bg-white border-l-4 border-blue-500 text-gray-700' // default
          }`}
          onClick={() => dismiss(toast.id)}
        >
          {toast.title && (
            <div className="font-semibold mb-1">{toast.title}</div>
          )}
          {toast.description && <div>{toast.description}</div>}
        </div>
      ))}
    </div>
  );
}