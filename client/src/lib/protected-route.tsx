
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // When this component mounts or updates, store the location info
  // This ensures we capture the exact path with any query parameters
  useEffect(() => {
    if (location.startsWith(path) && !user && !isLoading) {
      // Store the full location for more accurate redirects
      sessionStorage.setItem('auth_redirect', location);
      // Also store the base path as a fallback
      sessionStorage.setItem('auth_redirect_path', path);
    }
  }, [location, path, user, isLoading]);
  
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

        // If no user is logged in, redirect to the auth page with proper parameters
        if (!user) {
          // Store current path in URL parameters too as a redundant backup
          return <Redirect to={`/auth?redirect=${encodeURIComponent(path)}&ts=${Date.now()}`} />;
        }

        // User is authenticated, render the protected component
        return <Component />;
      }}
    </Route>
  );
}
