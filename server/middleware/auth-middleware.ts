/**
 * Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { userRoleEnum } from '@shared/schema';

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    console.log('[Auth Middleware] Unauthorized access attempt');
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    console.log('[Auth Middleware] Unauthorized access attempt to admin route');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user?.role !== userRoleEnum.enumValues[0]) { // admin role
    console.log(`[Auth Middleware] Access denied for non-admin user ${req.user.id} to admin route`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Middleware to require grant writer role
 */
export function requireGrantWriter(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    console.log('[Auth Middleware] Unauthorized access attempt to grant writer route');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user?.role !== userRoleEnum.enumValues[0] && // admin role 
      req.user?.role !== userRoleEnum.enumValues[1]) { // grant_writer role
    console.log(`[Auth Middleware] Access denied for user ${req.user.id} to grant writer route`);
    return res.status(403).json({ error: 'Grant writer access required' });
  }
  
  next();
}

/**
 * Middleware to require specific roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      console.log('[Auth Middleware] Unauthorized access attempt to role-protected route');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      console.log(`[Auth Middleware] Access denied for user ${req.user.id} with role ${req.user.role} to route requiring ${allowedRoles.join(', ')}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}