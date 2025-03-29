import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { ToastProvider } from "./hooks/use-toast";
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