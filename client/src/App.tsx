import React from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import SimpleDashboard from "./pages/SimpleDashboard";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";

// Simplified Toast Context for minimal app functionality
const ToastContext = React.createContext<{
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => void;
}>({
  toast: () => {}, // Default no-op implementation
});

// Simple toast provider
function SimpleToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: string;
  }>>([]);

  const toast = React.useCallback(
    ({ title, description, variant = 'default' }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      console.log(`${variant}: ${title} - ${description}`);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
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
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
            {toast.description && <div>{toast.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Simple hook to use toast
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Simplified ProtectedRoute component
function SimpleProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    // Simple check for user in localStorage
    const checkAuth = async () => {
      try {
        // Check for local storage user or make a simple API call
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Make a simple API call to check authentication
          const response = await fetch('/api/user');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <div className="redirect">
          {window.location.pathname !== '/auth' && (window.location.href = '/auth')}
          <div>Redirecting to login...</div>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/pricing">
        {() => {
          // Dynamically import the Pricing component
          const PricingPage = require('./pages/Pricing').default;
          return <PricingPage />;
        }}
      </Route>
      <Route path="/checkout/:planName">
        {(params) => {
          // Dynamically import the Checkout component
          const CheckoutPage = require('./pages/checkout').default;
          return <CheckoutPage />;
        }}
      </Route>
      <SimpleProtectedRoute path="/" component={SimpleDashboard} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SimpleToastProvider>
    </QueryClientProvider>
  );
}