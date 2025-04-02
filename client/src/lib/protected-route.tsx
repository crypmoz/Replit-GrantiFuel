
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  return (
    <Route path={path}>
      {() => {
        // Show loading state while authentication status is being determined
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // If no user is logged in, redirect to the auth page
        if (!user) {
          // Add a timestamp to force a clean page load
          return <Redirect to={`/auth?redirect=${encodeURIComponent(path)}&ts=${Date.now()}`} />;
        }

        // User is authenticated, render the protected component
        return <Component />;
      }}
    </Route>
  );
}
