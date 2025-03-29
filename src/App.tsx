import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster, ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./lib/protected-route";
import SimpleDashboard from "./pages/SimpleDashboard";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";

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
      <ProtectedRoute path="/" component={SimpleDashboard} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}