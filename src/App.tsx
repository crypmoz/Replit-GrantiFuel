import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "../client/src/components/ui/toaster";
import { queryClient } from "../client/src/lib/queryClient";
import { AuthProvider } from "../client/src/hooks/use-auth";
import SimpleDashboard from "../client/src/pages/SimpleDashboard";
import AuthPage from "../client/src/pages/auth-page";
import NotFound from "../client/src/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/">
        {() => {
          const { user, isLoading } = require("../client/src/hooks/use-auth").useAuth();
          
          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            );
          }
          
          if (!user) {
            window.location.href = "/auth";
            return null;
          }
          
          return <SimpleDashboard />;
        }}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}