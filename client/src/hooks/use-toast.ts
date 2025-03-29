// This hook provides a simple toast notification system
// We're using a simplified version until we implement the full UI components

import { useState } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Add the toast to the array
    setToasts((prevToasts) => [...prevToasts, { id, title, description, variant }]);
    
    // Remove the toast after the duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);
    
    return id;
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    } else {
      setToasts([]);
    }
  };

  return {
    toast,
    dismiss,
    toasts,
  };
}

// When we implement proper UI components, this will be replaced with a more comprehensive solution