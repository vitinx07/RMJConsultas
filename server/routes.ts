import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireManagerOrAdmin, requireAnyRole } from "./auth";
import { loginSchema, createUserSchema, updateUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session store
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: 24 * 60 * 60, // 24 hours
    tableName: "sessions",
  });

  // Session middleware
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "fallback-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Initialize admin user on startup
  try {
    await storage.createAdminUser();
    console.log("✅ Sistema inicializado com usuário administrador padrão");
  } catch (error) {
    console.error("❌ Erro ao criar usuário administrador:", error);
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Public authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateCredentials(username, password);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.userId = user.id;
      
      // Return user without password
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(400).json({ error: "Dados de login inválidos" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao fazer logout:", err);
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Protected routes - Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const newUser = await storage.createUser(userData, req.user!.id);
      const { passwordHash, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(400).json({ error: "Dados inválidos para criação de usuário" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userData = updateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Usuário atualizado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(400).json({ error: "Dados inválidos para atualização" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (id === req.user!.id) {
        return res.status(400).json({ error: "Não é possível deletar seu próprio usuário" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Existing benefit API routes (require authentication)
  app.post("/api/multicorban/cpf", requireAuth, requireAnyRole, async (req, res) => {
    try {
      const { cpf } = req.body;
      
      console.log(`Consultando CPF: ${cpf}`);
      const response = await fetch("https://api.multicorban.com/cpf", {
        method: "POST",
        headers: {
          "Authorization": "4630e3b1ad52c0397c64c81e5a3fb8ec",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf: cpf,
        }),
      });

      if (!response.ok) {
        console.error(`Erro na API MULTI CORBAN: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error("Resposta de erro:", errorText);
        
        return res.status(response.status).json({ 
          error: `Erro na API MULTI CORBAN: ${response.status}`,
          details: errorText || "Erro desconhecido da API"
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Erro na consulta por CPF:", error);
      res.status(500).json({ error: "Erro ao consultar CPF" });
    }
  });

  app.post("/api/multicorban/offline", requireAuth, requireAnyRole, async (req, res) => {
    try {
      const { beneficio } = req.body;
      
      console.log(`Consultando benefício: ${beneficio}`);
      const response = await fetch("https://api.multicorban.com/offline", {
        method: "POST",
        headers: {
          "Authorization": "4630e3b1ad52c0397c64c81e5a3fb8ec",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beneficio: beneficio,
        }),
      });

      if (!response.ok) {
        console.error(`Erro na API MULTI CORBAN offline: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error("Resposta de erro offline:", errorText);
        
        return res.status(response.status).json({ 
          error: `Erro na API MULTI CORBAN: ${response.status}`,
          details: errorText || "Erro desconhecido da API"
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Erro na consulta offline:", error);
      res.status(500).json({ error: "Erro ao consultar benefício" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
