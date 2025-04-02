import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface RoleBasedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}

/**
 * Wrapper for Route component that checks if user has required role before rendering
 * 
 * @param path - URL path to match
 * @param component - Component to render if user has permission
 * @param allowedRoles - Array of roles that are allowed to access this route
 */
export function RoleBasedRoute({
  path,
  component: Component,
  allowedRoles = []
}: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth();

  // Create the route with appropriate rendering logic
  return (
    <Route path={path}>
      {() => {
        // Show loading spinner while checking authentication
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // If no user is logged in, redirect to auth page
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // If we don't need to check roles (empty array), just render the component
        if (allowedRoles.length === 0) {
          return <Component />;
        }
        
        // If user's role isn't in allowed roles, redirect to unauthorized page
        if (!allowedRoles.includes(user.role)) {
          return <Redirect to="/unauthorized" />;
        }
        
        // User has permission, render the component
        return <Component />;
      }}
    </Route>
  );
}

// Shorthand components for common role-based routes
export function AdminRoute({ path, component }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return <RoleBasedRoute path={path} component={component} allowedRoles={['admin']} />;
}

export function GrantWriterRoute({ path, component }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return <RoleBasedRoute path={path} component={component} allowedRoles={['admin', 'grant_writer']} />;
}

export function ManagerRoute({ path, component }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return <RoleBasedRoute path={path} component={component} allowedRoles={['admin', 'grant_writer', 'manager']} />;
}

export function ArtistRoute({ path, component }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return <RoleBasedRoute path={path} component={component} allowedRoles={['admin', 'grant_writer', 'manager', 'artist']} />;
}