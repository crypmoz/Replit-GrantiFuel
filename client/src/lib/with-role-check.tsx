import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * Higher Order Component to wrap components that require specific roles
 * 
 * @param WrappedComponent - The component to protect
 * @param allowedRoles - Array of roles that are allowed to access this component
 * @param redirectPath - Path to redirect to if user doesn't have permission
 * @returns A new component with role checking
 */
export function withRoleCheck<P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[] = [],
  redirectPath: string = "/auth"
) {
  return function WithRoleCheck(props: P) {
    const { user, isLoading } = useAuth();
    
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
      return <Redirect to={redirectPath} />;
    }
    
    // If we don't need to check roles (empty array), just render the component
    if (allowedRoles.length === 0) {
      return <WrappedComponent {...props} />;
    }
    
    // If user's role isn't in allowed roles, redirect to auth page
    if (!allowedRoles.includes(user.role)) {
      return <Redirect to="/unauthorized" />;
    }
    
    // User has permission, render the component
    return <WrappedComponent {...props} />;
  };
}

// Shorthand HOCs for common role checks
export const withAdminCheck = <P extends {}>(
  Component: React.ComponentType<P>
) => withRoleCheck(Component, ['admin']);

export const withGrantWriterCheck = <P extends {}>(
  Component: React.ComponentType<P>
) => withRoleCheck(Component, ['admin', 'grant_writer']);

export const withManagerCheck = <P extends {}>(
  Component: React.ComponentType<P>
) => withRoleCheck(Component, ['admin', 'grant_writer', 'manager']);

export const withArtistCheck = <P extends {}>(
  Component: React.ComponentType<P>
) => withRoleCheck(Component, ['admin', 'grant_writer', 'manager', 'artist']);