/**
 * JWT Authentication Utilities
 *
 * Handles token creation and verification for email/password auth.
 */

import jwt from 'jsonwebtoken';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY || 'orion-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';  // 7 days default
const JWT_ISSUER = 'orion';
const JWT_AUDIENCE = 'orion-client';

export interface JWTPayload {
  userId: string;
  email: string;
  businessId?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Create a JWT token for a user
 */
export function createToken(userId: string, email: string, businessId?: string): string {
  return jwt.sign(
    { userId, email, businessId },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Token verification failed:', (error as Error).message);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get token expiry time (for Set-Cookie)
 */
export function getTokenExpiry(): number {
  const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days in seconds

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}
