import React from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { useAuth } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";
import SimpleDashboard from "./pages/SimpleDashboard";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";
import LandingPage from "./pages/LandingPage";

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
                : 'bg-white border-l-4 border-purple-600 text-gray-700' // default
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
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
      <Layout>
        <Component />
      </Layout>
    </Route>
  );
}

// NavigationBar component
function NavigationBar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Grants', href: '/grants' },
    { name: 'Applications', href: '/applications' },
    { name: 'Artists', href: '/artists' },
    { name: 'Documents', href: '/documents' },
    { name: 'AI Assistant', href: '/assistant' },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-2xl font-bold gradient-text">GrantiFuel</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={`${location === link.href ? 'nav-link-active' : 'nav-link'}`}>
                    {link.name}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <Link href="/pricing">
              <a className="nav-link">Pricing</a>
            </Link>
            {user ? (
              <>
                <Link href="/profile">
                  <a className="flex items-center space-x-2 nav-link">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                      {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden md:inline">{user.name || user.username}</span>
                  </a>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="btn-secondary"
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <Link href="/auth">
                <a className="btn-primary">Sign In</a>
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location === link.href
                    ? 'border-purple-500 text-purple-700 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Link href="/pricing">
            <a
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
          </Link>
        </div>
        {user ? (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                  {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.name || user.username}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link href="/profile">
                <a
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Profile
                </a>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 flex flex-col gap-2">
              <Link href="/auth">
                <a
                  className="block text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Footer component
function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 gradient-text">GrantiFuel</h3>
            <p className="text-gray-600 mb-4 max-w-xs">
              Empowering musicians to secure grants and funding opportunities
              through streamlined applications.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-600">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-600">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-600">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-600 hover:text-purple-600">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/grants">
                  <a className="text-gray-600 hover:text-purple-600">Grants</a>
                </Link>
              </li>
              <li>
                <Link href="/applications">
                  <a className="text-gray-600 hover:text-purple-600">Applications</a>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="text-gray-600 hover:text-purple-600">Pricing</a>
                </Link>
              </li>
              <li>
                <Link href="/assistant">
                  <a className="text-gray-600 hover:text-purple-600">AI Assistant</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-gray-600">
                <span className="font-medium">Email:</span> support@grantifuel.com
              </li>
              <li className="text-gray-600">
                <span className="font-medium">Phone:</span> +1 (555) 123-4567
              </li>
              <li className="text-gray-600">
                <span className="font-medium">Address:</span> 1234 Music Ave, San Francisco, CA 94103
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            &copy; {new Date().getFullYear()} GrantiFuel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavigationBar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Layout component for public pages like landing page
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/auth">
        <PublicLayout>
          <AuthPage />
        </PublicLayout>
      </Route>
      <Route path="/pricing">
        {() => {
          // Dynamically import the Pricing component
          const PricingPage = require('./pages/Pricing').default;
          return (
            <Layout>
              <PricingPage />
            </Layout>
          );
        }}
      </Route>
      <Route path="/checkout/:planName">
        {(params) => {
          // Dynamically import the Checkout component
          const CheckoutPage = require('./pages/checkout').default;
          return (
            <Layout>
              <CheckoutPage planName={params.planName} />
            </Layout>
          );
        }}
      </Route>
      <Route path="/landing">
        <PublicLayout>
          <LandingPage />
        </PublicLayout>
      </Route>
      <SimpleProtectedRoute path="/dashboard" component={SimpleDashboard} />
      <Route path="/">
        <PublicLayout>
          <LandingPage />
        </PublicLayout>
      </Route>
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SimpleToastProvider>
    </QueryClientProvider>
  );
}