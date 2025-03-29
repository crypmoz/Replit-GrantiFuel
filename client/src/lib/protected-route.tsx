import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: () => JSX.Element;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        // Show loading state while checking authentication
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to auth page if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // If authenticated, render the component
        return <Component />;
      }}
    </Route>
  );
}