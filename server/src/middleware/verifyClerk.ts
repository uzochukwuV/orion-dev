/**
 * Clerk Token Verification Middleware
 * 
 * Verifies JWT tokens from Clerk and attaches clerk_id to req.user
 * All protected routes should use this middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;  // Clerk user ID
      };
    }
  }
}

export async function verifyClerkToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);  // Remove 'Bearer ' prefix

    // Verify token with Clerk
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach Clerk user ID to request
    req.user = {
      id: decoded.sub,  // Clerk user ID
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
