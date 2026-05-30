/**
 * JWT Verification Middleware
 * 
 * Verifies JWT tokens and attaches user info to req.user.
 * Use this instead of Clerk middleware for protected routes.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken as jwtVerifyToken, extractToken } from './jwt.js';

/**
 * Alias for backward compatibility
 */
export const verifyToken = jwtVerifyToken;

/**
 * Middleware to verify JWT token
 * Attaches user info to req.user on success
 */
export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    // Check for token in cookie first, then Authorization header
    let token = req.cookies?.auth_token;
    
    if (!token) {
      token = extractToken(req.headers.authorization);
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request
    (req as any).user = {
      id: payload.userId,
      email: payload.email,
      businessId: (payload as any).businessId,
    };

    next();
  } catch (error) {
    console.error('[JWT Middleware] Verification error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth middleware
 * Attaches user if token exists, but doesn't require it
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.auth_token;
    
    if (!token) {
      token = extractToken(req.headers.authorization);
    }

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        (req as any).user = {
          id: payload.userId,
          email: payload.email,
          businessId: (payload as any).businessId,
        };
      }
    }
  } catch {
    // Ignore errors in optional auth
  }
  
  next();
}