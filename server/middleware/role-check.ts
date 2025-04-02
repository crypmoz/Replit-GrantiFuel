import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the user has the required role
 * @param requiredRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export function requireRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to access this resource" });
    }

    // If no specific roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return next();
    }

    // Check if the user has one of the required roles
    const userRole = req.user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "You don't have permission to access this resource",
        requiredRoles: requiredRoles,
        userRole: userRole
      });
    }

    // User has the required role, proceed
    next();
  };
}

// Shorthand middlewares for common role checks
export const requireAdmin = requireRole(['admin']);
export const requireGrantWriter = requireRole(['admin', 'grant_writer']);
export const requireManager = requireRole(['admin', 'grant_writer', 'manager']);
export const requireArtist = requireRole(['admin', 'grant_writer', 'manager', 'artist']);