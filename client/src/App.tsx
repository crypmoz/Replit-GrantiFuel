import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "../../src/lib/queryClient";
import { AuthProvider } from "../../src/hooks/use-auth";
import { Toaster, ToastProvider } from "../../src/components/Toast";
import { ProtectedRoute } from "../../src/lib/protected-route";
import SimpleDashboard from "../../src/pages/SimpleDashboard";
import AuthPage from "../../src/pages/auth-page";
import NotFound from "../../src/pages/not-found";

function AppContent() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/pricing">
        {() => {
          // Dynamically import the Pricing component
          const PricingPage = require('../../src/pages/Pricing').default;
          return <PricingPage />;
        }}
      </Route>
      <Route path="/checkout/:planName">
        {(params) => {
          // Dynamically import the Checkout component
          const CheckoutPage = require('../../src/pages/checkout').default;
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