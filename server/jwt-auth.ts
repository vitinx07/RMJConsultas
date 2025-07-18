import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-jwt-secret';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateJWT = (user: { id: string; username: string; role: string }): string => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

// Middleware que tenta autenticar via sessão primeiro, depois JWT
export const requireAuthHybrid = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔒 Hybrid auth check - Path: ${req.path}, Host: ${req.headers.host}`);
  
  // Primeiro, tenta autenticação via sessão
  if (req.session && req.session.userId) {
    console.log(`✅ Session auth found - UserID: ${req.session.userId}`);
    try {
      const user = await storage.getUserById(req.session.userId);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        };
        console.log(`✅ Session auth success - User: ${user.username}`);
        return next();
      }
    } catch (error) {
      console.error('Session auth error:', error);
    }
  } else {
    console.log(`❌ No session found - SessionID: ${req.sessionID || 'none'}, Session: ${JSON.stringify(req.session || 'none')}`);
  }
  
  // Se sessão falhar, tenta JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log(`🔑 JWT auth attempt - Token: ${token.substring(0, 20)}...`);
    
    const payload = verifyJWT(token);
    if (payload) {
      try {
        const user = await storage.getUserById(payload.userId);
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
          };
          console.log(`✅ JWT auth success - User: ${user.username}`);
          return next();
        }
      } catch (error) {
        console.error('JWT auth error:', error);
      }
    }
  }
  
  console.log(`❌ Auth failed - No valid session or JWT`);
  return res.status(401).json({ error: "Não autenticado" });
};