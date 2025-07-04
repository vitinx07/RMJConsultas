import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Middleware para verificar se o usuário está autenticado
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy((err) => {
        if (err) console.error("Erro ao destruir sessão:", err);
      });
      return res.status(401).json({ error: "Usuário inválido ou inativo" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };

    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Middleware para verificar permissões específicas por role
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Permissão negada. Acesso restrito." });
    }

    next();
  };
};

// Middleware específico para administradores
export const requireAdmin = requireRole(["administrator"]);

// Middleware para gerentes e administradores
export const requireManagerOrAdmin = requireRole(["administrator", "gerente"]);

// Middleware para todos os usuários autenticados (vendedor, gerente, administrator)
export const requireAnyRole = requireRole(["administrator", "gerente", "vendedor"]);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}