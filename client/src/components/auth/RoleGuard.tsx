import { useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

/**
 * RoleGuard component conditionally renders its children based on the user's role
 * 
 * @param children - Content to display if user has permission
 * @param allowedRoles - Array of roles that have permission to view the children
 * @param fallback - Optional content to display if user doesn't have permission
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  
  // If no user is logged in or user has no role, show fallback
  if (!user || !user.role) return <>{fallback}</>;
  
  // If user's role is in the allowed roles list, show the children
  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }
  
  // Otherwise, show the fallback
  return <>{fallback}</>;
}

/**
 * AdminGuard - Shorthand component that only allows admin users to view content
 */
export function AdminGuard({ children, fallback = null }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * GrantWriterGuard - Only allows grant writers and admins to view content
 */
export function GrantWriterGuard({ children, fallback = null }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin', 'grant_writer']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * ManagerGuard - Only allows managers, grant writers, and admins to view content
 */
export function ManagerGuard({ children, fallback = null }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin', 'grant_writer', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * ArtistGuard - Only allows artists and higher roles to view content
 */
export function ArtistGuard({ children, fallback = null }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin', 'grant_writer', 'manager', 'artist']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}