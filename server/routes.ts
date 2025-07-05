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
      
      // Lista de endpoints para tentar
      const endpoints = [
        "https://sistema.multicorban.com.br/api/consulta-completa-cpf",
        "https://api.multicorban.com.br/consulta-completa-cpf",
        "https://multicorban.com.br/api/consulta-completa-cpf"
      ];

      let response = null;
      let lastError = null;

      // Tenta cada endpoint até encontrar um que funcione
      for (const endpoint of endpoints) {
        try {
          console.log(`Tentando endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            body: JSON.stringify({
              apikey: "4630e3b1ad52c0397c64c81e5a3fb8ec",
              cpf: cpf,
            }),
          });
          
          if (response.ok) {
            console.log(`Sucesso com endpoint: ${endpoint}`);
            break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.log(`Erro no endpoint ${endpoint}:`, errorMessage);
          lastError = error;
          response = null;
        }
      }

      // Se nenhum endpoint funcionou
      if (!response) {
        console.error("Todos os endpoints falharam:", lastError);
        return res.status(503).json({ 
          error: "Serviço MULTI CORBAN temporariamente indisponível. Tente novamente em alguns minutos.",
          details: "Não foi possível conectar ao servidor da API" 
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
      
      // Lista de endpoints para tentar
      const endpoints = [
        "https://sistema.multicorban.com.br/api/dados-offline",
        "https://api.multicorban.com.br/dados-offline",
        "https://multicorban.com.br/api/dados-offline"
      ];

      let response = null;
      let lastError = null;

      // Tenta cada endpoint até encontrar um que funcione
      for (const endpoint of endpoints) {
        try {
          console.log(`Tentando endpoint offline: ${endpoint}`);
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            body: JSON.stringify({
              apikey: "4630e3b1ad52c0397c64c81e5a3fb8ec",
              beneficio: beneficio,
            }),
          });
          
          if (response.ok) {
            console.log(`Sucesso com endpoint offline: ${endpoint}`);
            break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.log(`Erro no endpoint offline ${endpoint}:`, errorMessage);
          lastError = error;
          response = null;
        }
      }

      // Se nenhum endpoint funcionou
      if (!response) {
        console.error("Todos os endpoints offline falharam:", lastError);
        return res.status(503).json({ 
          error: "Serviço MULTI CORBAN temporariamente indisponível. Tente novamente em alguns minutos.",
          details: "Não foi possível conectar ao servidor da API" 
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
