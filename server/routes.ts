import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireManagerOrAdmin, requireAnyRole } from "./auth";
import { 
  loginSchema, 
  createUserSchema, 
  updateUserSchema,
  createConsultationSchema,
  createFavoriteClientSchema,
  updateFavoriteClientSchema,
  createNotificationSchema,
  createBenefitMonitoringSchema,
  resetPasswordSchema,
  insertClientMarkerSchema,
  clientMarkerStatusSchema,
} from "@shared/schema";
import { banrisulApi, BanrisulApiError } from "./banrisul-api";
import { generateJWT, requireAuthHybrid } from "./jwt-auth";
import { randomBytes } from "crypto";
import { emailService } from "./email";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure Express for Replit deployment
  app.set('trust proxy', 1); // Trust first proxy (Replit's proxy)

  // Configure session store
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: 24 * 60 * 60, // 24 hours
    tableName: "sessions",
  });

  // Session middleware - enhanced for deployment  
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "fallback-secret-key-change-in-production",
    resave: true, // Force save on every request for deployment
    saveUninitialized: true, // Save empty sessions for deployment
    rolling: true, // Reset expiry on each request
    cookie: {
      secure: false, // Keep false for compatibility with Replit
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Standard setting for Replit
      domain: undefined, // Let Express handle domain automatically
    },
    name: 'connect.sid',
  }));

  // Debug middleware for session
  app.use((req, res, next) => {
    if (req.path.includes('/api/auth/')) {
      console.log(`🔍 Session debug - Path: ${req.path}, Method: ${req.method}, SessionID: ${req.sessionID || 'none'}, UserID: ${req.session?.userId || 'none'}`);
      console.log(`🔍 Headers: ${JSON.stringify(req.headers.cookie || 'no-cookie')}`);
      console.log(`🔍 Session object: ${JSON.stringify(req.session || 'none')}`);
      console.log(`🔍 Environment: NODE_ENV=${process.env.NODE_ENV}, REPLIT_DEPLOYMENT=${process.env.REPLIT_DEPLOYMENT}, HOST=${req.headers.host}`);
    }
    next();
  });

  // Initialize admin user on startup
  try {
    await storage.createAdminUser();
    console.log("✅ Sistema inicializado com usuário administrador padrão");
  } catch (error) {
    console.error("❌ Erro ao criar usuário administrador:", error);
  }

  // Inicializar serviço de expiração de senhas
  const { passwordExpiryService } = await import("./password-expiry");
  passwordExpiryService.startPeriodicCheck();

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

      // Save session and wait for it to be stored
      req.session.userId = user.id;

      // Generate JWT token as backup
      const token = generateJWT(user);

      // Force session save and add explicit logging for deployment
      req.session.save((err) => {
        if (err) {
          console.error("❌ Erro ao salvar sessão:", err);
          return res.status(500).json({ error: "Erro ao salvar sessão" });
        }

        console.log(`✅ Session saved - UserID: ${user.id}, SessionID: ${req.sessionID}`);

        // Return user without password plus JWT token
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
          message: "Login realizado com sucesso",
          user: userWithoutPassword,
          token: token, // Include JWT token for backup authentication
        });
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
  app.get("/api/auth/me", requireAuthHybrid, async (req, res) => {
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
  app.get("/api/users", requireAuthHybrid, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/users/:id", requireAuthHybrid, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);

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

  app.post("/api/users", requireAuthHybrid, requireAdmin, async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const newUser = await storage.createUser(userData, req.user!.id);
      const { passwordHash, ...userWithoutPassword } = newUser;

      // Return success with password info if generated
      let responseMessage = "Usuário criado com sucesso";
      if (userData.generatePassword) {
        responseMessage += ". Senha gerada automaticamente";
        if (userData.sendPasswordByEmail && userData.email) {
          responseMessage += " e enviada por email";
        }
      }

      res.status(201).json({
        message: responseMessage,
        user: userWithoutPassword,
        emailSent: userData.sendPasswordByEmail && userData.email
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(400).json({ error: "Dados inválidos para criação de usuário" });
    }
  });

  app.put("/api/users/:id", requireAuthHybrid, requireAdmin, async (req, res) => {
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

  app.delete("/api/users/:id", requireAuthHybrid, requireAdmin, async (req, res) => {
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

  // Reset user password (admin only)
  app.post("/api/users/:id/reset-password", requireAuthHybrid, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const result = await storage.resetUserPassword(id, newPassword);

      res.json({
        message: "Senha redefinida com sucesso",
        emailSent: !!result.user.email,
        temporaryPassword: newPassword ? undefined : result.password
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Erro interno do servidor" });
    }
  });

  // Request password reset link (public)
  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists - security best practice
        return res.json({ message: "Se o email estiver cadastrado, você receberá um link de redefinição." });
      }

      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      const emailSent = await emailService.sendPasswordResetLink(user.email!, user.username, resetToken);

      res.json({ 
        message: "Se o email estiver cadastrado, você receberá um link de redefinição.",
        emailSent 
      });
    } catch (error) {
      console.error("Erro ao solicitar redefinição:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Reset password with token (public)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      await storage.updateUserPassword(resetToken.userId, newPassword);
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Change password (authenticated users)
  app.post("/api/auth/change-password", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Verify current password
      const user = await storage.validateCredentials(req.user!.username, currentPassword);
      if (!user) {
        return res.status(400).json({ error: "Senha atual incorreta" });
      }

      // Update password and remove mustChangePassword flag + set new expiry
      await storage.updateUserPassword(user.id, newPassword);
      
      // Set new password expiry and clear temporary flags
      const { passwordExpiryService } = await import("./password-expiry");
      await passwordExpiryService.setNewPasswordExpiry(user.id);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Password expiry status route
  app.get("/api/auth/password-status", requireAuthHybrid, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const { passwordExpiryService } = await import("./password-expiry");
      const daysUntilExpiry = passwordExpiryService.getDaysUntilExpiry(user.passwordExpiresAt);
      const isExpired = passwordExpiryService.isPasswordExpired(user.passwordExpiresAt);
      const shouldShowWarning = passwordExpiryService.shouldShowExpiryWarning(user.passwordExpiresAt);
      const warningMessage = passwordExpiryService.getExpiryWarningMessage(user.passwordExpiresAt);

      res.json({
        passwordExpiresAt: user.passwordExpiresAt,
        daysUntilExpiry,
        isExpired,
        shouldShowWarning,
        warningMessage,
        mustChangePassword: user.mustChangePassword || false
      });
    } catch (error) {
      console.error("Erro ao verificar status da senha:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Simulate password expiry for testing (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/auth/simulate-expiry", requireAuthHybrid, async (req, res) => {
      try {
        const { daysToExpiry } = req.body;
        
        if (typeof daysToExpiry !== 'number' || daysToExpiry < 0 || daysToExpiry > 365) {
          return res.status(400).json({ error: "Dias para expiração deve ser entre 0 e 365" });
        }

        const userId = req.user!.id;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysToExpiry);

        await db
          .update(users)
          .set({
            passwordExpiresAt: expiryDate,
            mustChangePassword: daysToExpiry === 0,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        res.json({ 
          message: `Senha configurada para expirar em ${daysToExpiry} dia(s)`,
          expiresAt: expiryDate,
          mustChangePassword: daysToExpiry === 0
        });
      } catch (error) {
        console.error("Erro ao simular expiração:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    });
  }

  // Send custom email (admin only)
  app.post("/api/admin/send-email", requireAuthHybrid, requireAdmin, async (req, res) => {
    try {
      const { recipients, subject, message, isHtml, attachments, customSender } = req.body;

      // Validate input
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: "Lista de destinatários é obrigatória" });
      }

      if (!subject || typeof subject !== 'string') {
        return res.status(400).json({ error: "Assunto é obrigatório" });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Mensagem é obrigatória" });
      }

      let emailsToSend = [];

      // Check if recipients are UUIDs or emails
      for (const recipient of recipients) {
        if (typeof recipient === 'string') {
          // Check if it's a valid UUID
          if (recipient.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // It's a UUID, get user by ID
            const user = await storage.getUserById(recipient);
            if (user && user.email) {
              emailsToSend.push(user.email);
            }
          } else if (recipient.includes('@')) {
            // It's an email address
            emailsToSend.push(recipient);
          }
        }
      }

      if (emailsToSend.length === 0) {
        return res.status(400).json({ error: "Nenhum email válido encontrado" });
      }

      // Process attachments if provided
      let processedAttachments;
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        processedAttachments = attachments.filter((att: any) => 
          att && typeof att.name === 'string' && typeof att.content === 'string'
        );
        console.log(`📎 ${processedAttachments.length} anexo(s) recebido(s) para processamento`);
      }

      let successCount = 0;
      let errorCount = 0;
      let errors: string[] = [];

      // Send emails
      for (const email of emailsToSend) {
        try {
          const success = await emailService.sendCustomEmail(email, subject, message, isHtml, processedAttachments, customSender);
          if (success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Falha ao enviar para ${email}`);
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Erro ao enviar para ${email}: ${error.message}`);
        }
      }

      res.json({
        message: `${successCount} de ${emailsToSend.length} emails enviados com sucesso`,
        totalSent: successCount,
        totalRequested: emailsToSend.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Erro ao enviar emails:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Helper function to get user-friendly error messages
  const getErrorMessage = (status: number, errorText: string) => {
    switch (status) {
      case 400:
        return {
          title: "Dados Inválidos",
          message: "Os dados informados são inválidos. Verifique se o CPF ou número do benefício estão corretos.",
          details: errorText
        };
      case 401:
        return {
          title: "Acesso Negado",
          message: "Chave de API inválida ou expirada. Entre em contato com o administrador.",
          details: errorText
        };
      case 403:
        return {
          title: "Acesso Proibido",
          message: "Sem permissão para acessar este recurso. Verifique suas credenciais.",
          details: errorText
        };
      case 404:
        return {
          title: "Dados Não Encontrados",
          message: "Nenhum benefício encontrado para os dados informados.",
          details: errorText
        };
      case 422:
        return {
          title: "Formato Inválido",
          message: "Os dados estão em formato incorreto. Verifique se o CPF tem 11 dígitos.",
          details: errorText
        };
      case 429:
        return {
          title: "Muitas Tentativas",
          message: "Limite de consultas excedido. Aguarde alguns minutos antes de tentar novamente.",
          details: errorText
        };
      case 500:
        return {
          title: "Erro Interno do Servidor",
          message: "Erro interno na API MULTI CORBAN. Tente novamente em alguns minutos.",
          details: errorText
        };
      case 502:
        return {
          title: "Gateway Indisponível",
          message: "O servidor da API MULTI CORBAN está temporariamente indisponível.",
          details: errorText
        };
      case 503:
        return {
          title: "Serviço Indisponível",
          message: "O sistema MULTI CORBAN está temporariamente em manutenção ou sobrecarregado.",
          details: errorText
        };
      case 504:
        return {
          title: "Tempo Esgotado",
          message: "A consulta demorou muito para responder. Tente novamente.",
          details: errorText
        };
      default:
        return {
          title: "Erro Desconhecido",
          message: `Erro inesperado (código ${status}). Entre em contato com o suporte.`,
          details: errorText
        };
    }
  };

  // Existing benefit API routes (require authentication)
  app.post("/api/multicorban/cpf", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { cpf } = req.body;

      console.log(`Consultando CPF: ${cpf}`);
      const response = await fetch("https://api.multicorban.com/cpf", {
        method: "POST",
        headers: {
          "Authorization": "379825096e2347b3064194022ea59b03",
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

        const errorInfo = getErrorMessage(response.status, errorText);

        return res.status(response.status).json({ 
          error: errorInfo.message,
          title: errorInfo.title,
          details: errorInfo.details,
          status: response.status
        });
      }

      const data = await response.json();

      // Save consultation to database
      try {
        if (Array.isArray(data) && data.length > 0) {
          for (const benefit of data) {
            const beneficiary = benefit.Beneficiario;
            const financial = benefit.ResumoFinanceiro;

            await storage.createConsultation({
              userId: req.user!.id,
              searchType: "cpf",
              searchValue: cpf,
              cpf: beneficiary.CPF,
              benefitNumber: beneficiary.Beneficio,
              beneficiaryName: beneficiary.Nome,
              benefitValue: financial.ValorBeneficio,
              availableMargin: financial.MargemDisponivelEmprestimo,
              loanBlocked: beneficiary.BloqueadoEmprestimo === "SIM",
              blockReason: beneficiary.MotivoBloqueio,
              resultData: benefit,
            });
          }
        }
      } catch (dbError) {
        console.error("Erro ao salvar consulta no banco:", dbError);
        // Don't fail the request, just log the error
      }

      res.json(data);
    } catch (error) {
      console.error("Erro na consulta por CPF:", error);
      res.status(500).json({ 
        error: "Erro de conectividade. Verifique sua conexão com a internet.",
        title: "Erro de Conexão",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.post("/api/multicorban/offline", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { beneficio } = req.body;

      console.log(`Consultando benefício: ${beneficio}`);
      const response = await fetch("https://api.multicorban.com/offline", {
        method: "POST",
        headers: {
          "Authorization": "379825096e2347b3064194022ea59b03",
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

        const errorInfo = getErrorMessage(response.status, errorText);

        return res.status(response.status).json({ 
          error: errorInfo.message,
          title: errorInfo.title,
          details: errorInfo.details,
          status: response.status
        });
      }

      const data = await response.json();

      // Save consultation to database
      try {
        if (data && data.Beneficiario) {
          const beneficiary = data.Beneficiario;
          const financial = data.ResumoFinanceiro;

          await storage.createConsultation({
            userId: req.user!.id,
            searchType: "beneficio",
            searchValue: beneficio,
            cpf: beneficiary.CPF,
            benefitNumber: beneficiary.Beneficio,
            beneficiaryName: beneficiary.Nome,
            benefitValue: financial.ValorBeneficio,
            availableMargin: financial.MargemDisponivelEmprestimo,
            loanBlocked: beneficiary.BloqueadoEmprestimo === "SIM",
            blockReason: beneficiary.MotivoBloqueio,
            resultData: data,
          });
        }
      } catch (dbError) {
        console.error("Erro ao salvar consulta no banco:", dbError);
        // Don't fail the request, just log the error
      }

      res.json(data);
    } catch (error) {
      console.error("Erro na consulta offline:", error);
      res.status(500).json({ 
        error: "Erro de conectividade. Verifique sua conexão com a internet.",
        title: "Erro de Conexão",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // C6 Bank contracts endpoint (simplified)
  app.post('/api/c6/contracts', requireAuthHybrid, async (req, res) => {
    try {
      const { cpf } = req.body;
      
      // Esta é uma simulação para o sistema atual
      // Em uma implementação real, buscaria contratos do C6 Bank via API
      const mockContracts = [
        {
          contrato: "9044297711",
          dataContrato: "2023-01-15",
          valorParcela: 350.50,
          refinanciavel: true,
          saldoDevedor: 5200.00,
          quantidadeParcelas: 84,
          convenio: "INSS"
        },
        {
          contrato: "010121587986",
          dataContrato: "2022-11-20",
          valorParcela: 280.75,
          refinanciavel: true,
          saldoDevedor: 4100.00,
          quantidadeParcelas: 72,
          convenio: "INSS"
        }
      ];

      res.json(mockContracts);
    } catch (error) {
      console.error('Erro ao buscar contratos C6:', error);
      res.status(500).json({ error: 'Erro ao buscar contratos C6 Bank' });
    }
  });

  // C6 Bank simulate endpoint (simplified)
  app.post('/api/c6/simulate', requireAuthHybrid, async (req, res) => {
    try {
      const { cpf, dataNascimento, valorDesejado, prazoDesejado, contratos } = req.body;
      
      // Esta é uma simulação para o sistema atual
      // Em uma implementação real, faria simulação via API do C6 Bank
      const mockSimulation = [
        {
          prazo: prazoDesejado || "84",
          valorAF: valorDesejado * 0.15,
          valorParcela: valorDesejado / parseInt(prazoDesejado || "84"),
          valorTotal: valorDesejado * 1.25,
          taxa: 1.85,
          plano: "C6 REFINANCIAMENTO"
        }
      ];

      res.json(mockSimulation);
    } catch (error) {
      console.error('Erro na simulação C6:', error);
      res.status(500).json({ error: 'Erro na simulação C6 Bank' });
    }
  });

  // C6 Bank API endpoints (full implementation)
  app.post('/api/c6-bank/simulate', requireAuthHybrid, async (req, res) => {
    try {
      const { cpf, installment_quantity, selected_contracts, simulation_type, requested_amount, installment_amount } = req.body;

      // 1. Autenticar no C6 Bank
      const authResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username: '46437248890_003130',
          password: 'Nipo4810**'
        })
      });

      if (!authResponse.ok) {
        return res.status(500).json({ error: 'Falha na autenticação C6 Bank' });
      }

      const authData = await authResponse.json();
      const token = authData.access_token;

      // 2. Buscar dados do cliente
      const baseUrl = req.headers.host?.includes('replit.dev') || req.headers.host?.includes('worf.replit.dev') 
        ? `https://${req.headers.host}` 
        : 'http://localhost:5000';
      
      const clientData = await fetch(`${baseUrl}/api/multicorban/cpf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || ''
        },
        body: JSON.stringify({ cpf })
      });

      const clientInfo = await clientData.json();
      const beneficiario = clientInfo[0]?.Beneficiario;
      const resumoFinanceiro = clientInfo[0]?.ResumoFinanceiro;

      if (!beneficiario) {
        return res.status(400).json({ error: 'Dados do cliente não encontrados' });
      }

      // 3. Montar payload de simulação
      const simulationPayload = {
        operation_type: "REFINANCIAMENTO",
        product_type_code: "0002",
        simulation_type,
        formalization_subtype: "DIGITAL_WEB",
        promoter_code: "003130",
        covenant_group: "INSS",
        public_agency: "000001",
        installment_quantity,
        ...(simulation_type === 'POR_VALOR_SOLICITADO' 
          ? { requested_amount } 
          : { installment_amount }
        ),
        client: {
          tax_identifier: beneficiario.CPF,
          enrollment: beneficiario.Beneficio,
          birth_date: beneficiario.DataNascimento,
          income_amount: parseFloat(resumoFinanceiro?.ValorBeneficio || '5000')
        },
        refinancing_contracts: selected_contracts
      };

      // 4. Fazer simulação no C6
      const simulationResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/marketplace/proposal/simulation', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.c6bank_error_data_v2+json'
        },
        body: JSON.stringify(simulationPayload)
      });

      if (!simulationResponse.ok) {
        const errorData = await simulationResponse.json();
        return res.status(simulationResponse.status).json({
          error: 'Erro na simulação C6 Bank',
          details: errorData
        });
      }

      const simulationResult = await simulationResponse.json();
      res.json(simulationResult);

    } catch (error) {
      console.error('Erro na simulação C6:', error);
      res.status(500).json({ error: 'Erro interno na simulação C6 Bank' });
    }
  });

  app.post('/api/c6-bank/include-proposal', requireAuthHybrid, async (req, res) => {
    try {
      const { cpf, benefit_data, selected_contracts, credit_condition, expenses, proposal_data, selected_expense = '' } = req.body;

      // 1. Autenticar no C6 Bank
      const authResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username: '46437248890_003130',
          password: 'Nipo4810**'
        })
      });

      if (!authResponse.ok) {
        return res.status(500).json({ error: 'Falha na autenticação C6 Bank' });
      }

      const authData = await authResponse.json();
      const token = authData.access_token;

      // 2. Preparar dados bancários com limpeza e validação
      const bankData = proposal_data.client.bank_data;
      const paymentData = {
        bank_code: String(bankData.bank_code).split('-')[0].trim().replace(/\D/g, ''),
        agency_number: String(bankData.agency_number).replace(/\D/g, ''),
        agency_digit: bankData.agency_digit || '0',
        account_type: bankData.account_type,
        account_number: String(bankData.account_number).replace(/\D/g, '').slice(0, -1),
        account_digit: String(bankData.account_number).replace(/\D/g, '').slice(-1)
      };

      // 3. O credit_condition já vem processado do frontend
      const creditConditionForInclusion = { ...credit_condition };

      // 4. Usar despesas já processadas do frontend
      const expensesForInclusion = expenses || [];

      // 4. Montar payload de inclusão
      const inclusionPayload = {
        formalization_subtype: "DIGITAL_WEB",
        operation_type: "REFINANCIAMENTO",
        simulation_type: "POR_VALOR_PARCELA",
        origin: {
          promoter_code: "003130",
          covenant_group: "INSS",
          public_agency: "000001",
          typist_code: "390419",
          tax_identifier_of_certified_agent: "46437248890"
        },
        credit_condition: creditConditionForInclusion,
        client: {
          tax_identifier: proposal_data.client.tax_identifier,
          name: proposal_data.client.name,
          document_type: proposal_data.client.document_type || "RG",
          document_number: proposal_data.client.document_number,
          document_federation_unit: proposal_data.client.document_federation_unit || "SP",
          issuance_date: proposal_data.client.issuance_date || "2010-01-01",
          government_agency_which_has_issued_the_document: proposal_data.client.government_agency_which_has_issued_the_document || "SSP",
          marital_status: proposal_data.client.marital_status || "Solteiro",
          spouses_name: proposal_data.client.spouses_name || "",
          politically_exposed_person: proposal_data.client.politically_exposed_person || "Nao",
          birth_date: proposal_data.client.birth_date,
          gender: proposal_data.client.gender,
          income_amount: proposal_data.client.income_amount,
          mother_name: proposal_data.client.mother_name,
          email: proposal_data.client.email,
          mobile_phone_area_code: proposal_data.client.mobile_phone_area_code,
          mobile_phone_number: proposal_data.client.mobile_phone_number,
          bank_data: paymentData, // CORREÇÃO: bank_data dentro do client conforme API
          benefit_data: {
            receive_card_benefit: "Nao",
            federation_unit: benefit_data.Beneficiario?.UFBeneficio || "SP"
          },
          address: {
            street: proposal_data.client.address.street,
            number: proposal_data.client.address.number,
            neighborhood: proposal_data.client.address.neighborhood,
            city: proposal_data.client.address.city,
            federation_unit: proposal_data.client.address.federation_unit,
            zip_code: proposal_data.client.address.zip_code.replace(/\D/g, '') // Remove todos os caracteres não numéricos
          },
          professional_data: {
            enrollment: benefit_data.Beneficiario?.Beneficio
          }
        },
        refinancing_contracts: selected_contracts,
        expenses: expensesForInclusion
      };

      // Validação dos campos obrigatórios antes do envio
      const validationErrors = [];
      
      if (!creditConditionForInclusion.covenant_code) validationErrors.push('covenant_code ausente');
      if (!creditConditionForInclusion.product_code) validationErrors.push('product_code ausente');
      if (!creditConditionForInclusion.principal_amount) validationErrors.push('principal_amount ausente');
      if (!creditConditionForInclusion.client_amount) validationErrors.push('client_amount ausente');
      if (!creditConditionForInclusion.monthly_effective_total_cost_rate) validationErrors.push('monthly_effective_total_cost_rate ausente');
      if (!inclusionPayload.client?.tax_identifier) validationErrors.push('CPF ausente');
      if (!inclusionPayload.client?.name) validationErrors.push('Nome ausente');
      if (!inclusionPayload.client?.birth_date) validationErrors.push('Data de nascimento ausente');
      if (!inclusionPayload.client?.address?.zip_code || inclusionPayload.client.address.zip_code.length !== 8) {
        validationErrors.push('CEP inválido (deve ter 8 dígitos)');
      }
      if (!paymentData.bank_code) validationErrors.push('Código do banco ausente');
      if (!paymentData.agency_number) validationErrors.push('Agência ausente');
      if (!paymentData.account_number) validationErrors.push('Conta ausente');
      if (!inclusionPayload.client.bank_data) validationErrors.push('bank_data ausente no client');
      
      if (validationErrors.length > 0) {
        console.error('❌ VALIDAÇÃO FALHOU:', validationErrors);
        return res.status(400).json({
          error: 'Campos obrigatórios faltando ou inválidos',
          validation_errors: validationErrors,
          received_data: {
            covenant_code: creditConditionForInclusion.covenant_code,
            product_code: creditConditionForInclusion.product_code,
            principal_amount: creditConditionForInclusion.principal_amount,
            client_amount: creditConditionForInclusion.client_amount,
            monthly_effective_total_cost_rate: creditConditionForInclusion.monthly_effective_total_cost_rate,
            cpf: inclusionPayload.client?.tax_identifier,
            cep: inclusionPayload.client?.address?.zip_code,
            bank_code: paymentData.bank_code,
            agency: paymentData.agency_number,
            account: paymentData.account_number
          }
        });
      }

      // Log do payload completo antes do envio
      console.log('📤 PAYLOAD COMPLETO PARA C6:', JSON.stringify(inclusionPayload, null, 2));
      console.log('🔍 BANK_DATA STRUCTURE:', JSON.stringify(paymentData, null, 2));
      
      // 5. Fazer inclusão no C6
      const inclusionResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/marketplace/proposal', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.c6bank_error_data_v2+json'
        },
        body: JSON.stringify(inclusionPayload)
      });

      console.log('📥 C6 RESPONSE STATUS:', inclusionResponse.status);
      
      if (!inclusionResponse.ok) {
        const errorData = await inclusionResponse.json();
        console.error('❌ C6 INCLUSION ERROR (Status ' + inclusionResponse.status + '):', errorData);
        console.error('📋 PAYLOAD QUE CAUSOU ERRO:', JSON.stringify(inclusionPayload, null, 2));
        
        // Verificar campos obrigatórios específicos
        console.log('🔍 CAMPOS CRÍTICOS:');
        console.log('  - covenant_code:', creditConditionForInclusion.covenant_code);
        console.log('  - product_code:', creditConditionForInclusion.product_code);
        console.log('  - client name:', inclusionPayload.client?.name);
        console.log('  - cpf:', inclusionPayload.client?.tax_identifier);
        console.log('  - expenses count:', inclusionPayload.expenses?.length);
        
        return res.status(inclusionResponse.status).json({
          error: 'Erro na inclusão da proposta C6 Bank',
          details: errorData,
          status: inclusionResponse.status,
          payload: inclusionPayload
        });
      }

      const inclusionResult = await inclusionResponse.json();
      console.log('✅ PROPOSTA DIGITADA COM SUCESSO:', inclusionResult);
      
      // Se tiver número da proposta, iniciar tentativas de busca do link
      if (inclusionResult.proposalNumber) {
        console.log('🔄 Iniciando tentativas para buscar link de formalização...');
        console.log('📋 Número da proposta:', inclusionResult.proposalNumber);
        
        // Adicionar informações de tentativas na resposta
        inclusionResult.linkAttemptInfo = {
          proposalNumber: inclusionResult.proposalNumber,
          maxAttempts: 15,
          intervalMinutes: 5
        };
      }
      
      res.json(inclusionResult);

    } catch (error) {
      console.error('Erro na inclusão C6:', error);
      res.status(500).json({ error: 'Erro interno na inclusão de proposta C6 Bank' });
    }
  });

  // Endpoint com sistema de 15 tentativas para buscar link de formalização
  app.post('/api/c6-bank/formalization-link-attempts', requireAuthHybrid, async (req, res) => {
    try {
      const { proposalNumber } = req.body;
      
      if (!proposalNumber) {
        return res.status(400).json({ error: 'Número da proposta é obrigatório' });
      }

      console.log('🚀 Iniciando 15 tentativas para proposta:', proposalNumber);
      
      let attemptCount = 0;
      const maxAttempts = 15;
      const intervalMs = 5 * 60 * 1000; // 5 minutos

      const tryGetLink = async () => {
        attemptCount++;
        console.log(`🔄 Tentativa ${attemptCount}/${maxAttempts} para proposta ${proposalNumber}`);

        try {
          // 1. Autenticar no C6 Bank
          const authResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              username: '46437248890_003130',
              password: 'Nipo4810**'
            })
          });

          if (!authResponse.ok) {
            throw new Error('Falha na autenticação C6 Bank');
          }

          const authData = await authResponse.json();
          const token = authData.access_token;

          // 2. Buscar link de formalização
          const linkResponse = await fetch(`https://marketplace-proposal-service-api-p.c6bank.info/marketplace/proposal/formalization-url?proposalNumber=${proposalNumber}`, {
            method: 'GET',
            headers: {
              'Authorization': token,
              'Accept': 'application/vnd.c6bank_url_consult_v1+json'
            }
          });

          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            console.log('✅ LINK ENCONTRADO na tentativa', attemptCount, ':', linkData);
            return { success: true, data: linkData, attempt: attemptCount };
          } else if (linkResponse.status === 404) {
            console.log(`❌ Tentativa ${attemptCount}: Link ainda não disponível`);
            return { success: false, status: 404, attempt: attemptCount };
          } else {
            console.log(`❌ Tentativa ${attemptCount}: Erro ${linkResponse.status}`);
            const errorText = await linkResponse.text();
            return { success: false, status: linkResponse.status, attempt: attemptCount, error: errorText };
          }
        } catch (error) {
          console.error(`❌ Tentativa ${attemptCount} falhou:`, error);
          return { success: false, error: error.message, attempt: attemptCount };
        }
      };

      // Primeira tentativa imediata
      let result = await tryGetLink();
      
      if (result.success) {
        return res.json({
          ...result.data,
          attemptInfo: {
            attemptUsed: result.attempt,
            totalAttempts: maxAttempts,
            status: 'found'
          }
        });
      }

      // Se não encontrou, configurar tentativas periódicas
      res.json({
        message: 'Sistema de tentativas iniciado. O link será buscado automaticamente a cada 5 minutos.',
        proposalNumber,
        attemptInfo: {
          currentAttempt: attemptCount,
          maxAttempts,
          intervalMinutes: 5,
          status: 'searching'
        }
      });

      // Continuar tentativas em background
      const intervalId = setInterval(async () => {
        if (attemptCount >= maxAttempts) {
          console.log(`⏰ Limite de ${maxAttempts} tentativas atingido para proposta ${proposalNumber}`);
          clearInterval(intervalId);
          return;
        }

        result = await tryGetLink();
        
        if (result.success) {
          console.log(`🎉 SUCESSO! Link encontrado na tentativa ${result.attempt} para proposta ${proposalNumber}`);
          console.log(`🔗 Link disponível: ${result.data.url || result.data.formalizationUrl}`);
          clearInterval(intervalId);
        }
      }, intervalMs);

    } catch (error) {
      console.error('Erro no sistema de tentativas:', error);
      res.status(500).json({ error: 'Erro interno no sistema de tentativas' });
    }
  });

  app.get('/api/c6-bank/formalization-link/:proposalNumber', requireAuthHybrid, async (req, res) => {
    try {
      const { proposalNumber } = req.params;

      console.log('🔍 Consultando link para proposta:', proposalNumber);

      // 1. Autenticar no C6 Bank
      const authResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username: '46437248890_003130',
          password: 'Nipo4810**'
        })  
      });

      if (!authResponse.ok) {
        return res.status(500).json({ error: 'Falha na autenticação C6 Bank' });
      }

      const authData = await authResponse.json();
      const token = authData.access_token;

      // 2. Buscar link de formalização
      const linkResponse = await fetch(`https://marketplace-proposal-service-api-p.c6bank.info/marketplace/proposal/formalization-url?proposalNumber=${proposalNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Accept': 'application/vnd.c6bank_url_consult_v1+json'
        }
      });

      console.log('📥 C6 Link Response Status:', linkResponse.status);

      if (!linkResponse.ok) {
        const errorText = await linkResponse.text();
        console.log('❌ Erro na busca do link:', errorText);
        
        if (linkResponse.status === 404) {
          return res.status(404).json({ 
            error: 'Link ainda não disponível',
            message: 'O link de formalização ainda não foi gerado pelo C6 Bank. Use o sistema de tentativas para buscar automaticamente.'
          });
        }
        return res.status(linkResponse.status).json({ 
          error: 'Erro ao buscar link de formalização',
          details: errorText
        });
      }

      const linkData = await linkResponse.json();
      console.log('✅ Link encontrado:', linkData);
      res.json(linkData);

    } catch (error) {
      console.error('Erro ao buscar link C6:', error);
      res.status(500).json({ error: 'Erro interno ao buscar link de formalização' });
    }
  });

  app.get('/api/c6-bank/proposal-status/:proposalNumber', requireAuthHybrid, async (req, res) => {
    try {
      const { proposalNumber } = req.params;

      // 1. Autenticar no C6 Bank
      const authResponse = await fetch('https://marketplace-proposal-service-api-p.c6bank.info/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username: '46437248890_003130',
          password: 'Nipo4810**'
        })
      });

      if (!authResponse.ok) {
        return res.status(500).json({ error: 'Falha na autenticação C6 Bank' });
      }

      const authData = await authResponse.json();
      const token = authData.access_token;

      // 2. Consultar status da proposta
      const statusResponse = await fetch(`https://marketplace-proposal-service-api-p.c6bank.info/marketplace/proposal/consult?proposalNumber=${proposalNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Accept': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        return res.status(statusResponse.status).json({ error: 'Erro ao consultar status da proposta' });
      }

      const statusData = await statusResponse.json();
      res.json(statusData);

    } catch (error) {
      console.error('Erro ao consultar status C6:', error);
      res.status(500).json({ error: 'Erro interno ao consultar status da proposta' });
    }
  });

  // Banrisul API endpoints
  app.post("/api/banrisul/contracts", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { cpf } = req.body;

      if (!cpf) {
        return res.status(400).json({ 
          error: "CPF é obrigatório",
          title: "Dados Inválidos",
          details: "O CPF do cliente deve ser fornecido"
        });
      }

      console.log(`Buscando contratos Banrisul para CPF: ${cpf}`);
      const contracts = await banrisulApi.getContracts(cpf);

      // Filtrar apenas contratos refinanciáveis
      const refinanciableContracts = contracts.filter(contract => contract.refinanciavel);

      res.json(refinanciableContracts);
    } catch (error) {
      console.error("Erro ao buscar contratos Banrisul:", error);

      if (error instanceof BanrisulApiError) {
        return res.status(error.statusCode).json({
          error: error.message,
          title: "Erro na API Banrisul",
          details: error.apiResponse || "Erro na comunicação com o servidor Banrisul",
          status: error.statusCode
        });
      }

      res.status(500).json({ 
        error: "Erro interno do servidor",
        title: "Erro de Servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.post("/api/banrisul/simulate", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { 
        cpf, 
        dataNascimento, 
        conveniada, 
        contrato, 
        dataContrato, 
        prestacao 
      } = req.body;

      if (!cpf || !dataNascimento || !conveniada || !contrato || !dataContrato || !prestacao) {
        return res.status(400).json({ 
          error: "Todos os campos obrigatórios devem ser preenchidos",
          title: "Dados Inválidos",
          details: "CPF, data de nascimento, conveniada, contrato, data do contrato e prestação são obrigatórios"
        });
      }

      console.log(`Simulando refinanciamento Banrisul para contrato: ${contrato}`);

      // Primeiro, buscar contratos da Bem Promotora para obter a conveniada correta
      try {
        const contracts = await banrisulApi.getContracts(cpf);
        console.log('Contratos encontrados na Bem Promotora:', contracts?.length || 0);

        if (contracts && contracts.length > 0) {
          const matchingContract = contracts.find(c => 
            c.contrato === contrato || 
            String(parseInt(c.contrato)).padStart(10, '0') === contrato.replace(/\D/g, '').padStart(10, '0')
          );

          if (matchingContract) {
            console.log('Contrato encontrado na Bem Promotora:', matchingContract);
            console.log('Conveniada código:', matchingContract.conveniada);
            console.log('Conveniada descrição:', matchingContract.conveniadaDescricao);

            // Usar a conveniada do contrato encontrado
            const simulationPayload = {
              cpf,
              dataNascimento,
              conveniada: matchingContract.conveniada,
              contratosRefinanciamento: [{
                contrato,
                dataContrato
              }],
              prestacao: parseFloat(prestacao),
              retornarSomenteOperacoesViaveis: true
            };

            const result = await banrisulApi.simulateRefinancing(simulationPayload);

            if (!result.retorno || result.retorno.length === 0) {
              return res.status(404).json({
                error: "Nenhuma simulação viável encontrada",
                title: "Simulação Indisponível",
                details: result.erro || "Não foi possível encontrar opções de refinanciamento para os dados fornecidos"
              });
            }

            return res.json(result.retorno);
          }
        }
      } catch (contractError) {
        console.log('Erro ao buscar contratos, usando conveniada fornecida:', contractError);
      }

      // Se não encontrar o contrato, usar a conveniada fornecida
      const simulationPayload = {
        cpf,
        dataNascimento,
        conveniada,
        contratosRefinanciamento: [{
          contrato,
          dataContrato
        }],
        prestacao: parseFloat(prestacao),
        retornarSomenteOperacoesViaveis: true
      };

      const result = await banrisulApi.simulateRefinancing(simulationPayload);

      if (!result.retorno || result.retorno.length === 0) {
        return res.status(404).json({
          error: "Nenhuma simulação viável encontrada",
          title: "Simulação Indisponível",
          details: result.erro || "Não foi possível encontrar opções de refinanciamento para os dados fornecidos"
        });
      }

      res.json(result.retorno);
    } catch (error) {
      console.error("Erro na simulação Banrisul:", error);

      if (error instanceof BanrisulApiError) {
        return res.status(error.statusCode).json({
          error: error.message,
          title: "Erro na Simulação",
          details: error.apiResponse || "Erro na comunicação com o servidor Banrisul",
          status: error.statusCode
        });
      }

      res.status(500).json({ 
        error: "Erro interno do servidor",
        title: "Erro de Servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ============== NOVAS ROTAS PARA DASHBOARD E CRM ==============

  // Dashboard metrics (admin/manager only)
  app.get("/api/dashboard/stats", requireAuthHybrid, requireManagerOrAdmin, async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const stats = await storage.getDashboardStats(undefined, filters);
      res.json(stats);
    } catch (error) {
      console.error("Erro ao obter estatísticas do dashboard:", error);
      res.status(500).json({ error: "Erro ao carregar estatísticas" });
    }
  });

  // User-specific dashboard stats
  app.get("/api/dashboard/user-stats", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const stats = await storage.getDashboardStats(userId, filters);
      res.json(stats);
    } catch (error) {
      console.error("Erro ao obter estatísticas do usuário:", error);
      res.status(500).json({ error: "Erro ao carregar estatísticas" });
    }
  });

  // Consultation history routes
  app.get("/api/consultations", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const period = req.query.period ? parseInt(req.query.period as string) : 30;
      const consultations = await storage.getConsultations(period, userId);
      
      // Enriquecer dados com informações do resultData para melhor exibição
      const enrichedConsultations = consultations.map(consultation => {
        const resultData = consultation.resultData;
        let enrichedData = { ...consultation };
        
        if (resultData) {
          // Se resultData é um array, pegar o primeiro item
          const firstBenefit = Array.isArray(resultData) ? resultData[0] : resultData;
          
          if (firstBenefit && firstBenefit.Beneficiario) {
            // Usar dados já salvos nas colunas normalizadas, mas fallback para resultData se necessário
            if (!enrichedData.beneficiaryName) {
              enrichedData.beneficiaryName = firstBenefit.Beneficiario.Nome;
            }
            if (!enrichedData.benefitNumber) {
              enrichedData.benefitNumber = firstBenefit.Beneficiario.Beneficio;
            }
            if (!enrichedData.benefitValue && firstBenefit.ResumoFinanceiro) {
              enrichedData.benefitValue = firstBenefit.ResumoFinanceiro.ValorBeneficio;
            }
            if (!enrichedData.availableMargin && firstBenefit.ResumoFinanceiro) {
              enrichedData.availableMargin = firstBenefit.ResumoFinanceiro.MargemDisponivelEmprestimo;
            }
            if (enrichedData.loanBlocked === null || enrichedData.loanBlocked === undefined) {
              enrichedData.loanBlocked = firstBenefit.Beneficiario?.BloqueadoEmprestimo === 'SIM' || firstBenefit.Beneficiario?.BloqueadoEmprestimo === 'S';
            }
          }
        }
        
        return enrichedData;
      });
      
      res.json(enrichedConsultations);
    } catch (error) {
      console.error("Erro ao buscar histórico de consultas:", error);
      res.status(500).json({ error: "Erro ao carregar histórico" });
    }
  });

  app.get("/api/consultations/all", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      // Only admins and managers can see all consultations
      const user = req.user!;
      if (user.role !== "administrator" && user.role !== "gerente") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const consultations = await storage.getConsultationsByUser("", limit); // Empty string gets all
      res.json(consultations);
    } catch (error) {
      console.error("Erro ao buscar todas as consultas:", error);
      res.status(500).json({ error: "Erro ao carregar consultas" });
    }
  });



  // Create consultation record
  app.post("/api/consultations", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const consultationData = createConsultationSchema.parse({
        ...req.body,
        userId
      });

      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Erro ao criar registro de consulta:", error);
      res.status(400).json({ error: "Dados inválidos para registro de consulta" });
    }
  });

  // Check for existing consultation
  app.get("/api/consultations/check", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { cpf, benefitNumber } = req.query;
      const userId = req.user!.id;

      let consultation;
      if (cpf) {
consultation = await storage.getConsultationByCpf(cpf as string, userId);
      } else if (benefitNumber) {
        consultation = await storage.getConsultationByBenefit(benefitNumber as string, userId);
      } else {
        return res.status(400).json({ error: "CPF ou número do benefício é obrigatório" });
      }

      res.json({ exists: !!consultation, consultation });
    } catch (error) {
      console.error("Erro ao verificar consulta existente:", error);
      res.status(500).json({ error: "Erro ao verificar consulta" });
    }
  });

  // Favorite clients management
  app.get("/api/favorite-clients", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clients = await storage.getFavoriteClientsByUser(userId);
      res.json(clients);
    } catch (error) {
      console.error("Erro ao obter clientes favoritos:", error);
      res.status(500).json({ error: "Erro ao carregar clientes favoritos" });
    }
  });

  app.post("/api/favorite-clients", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const clientData = createFavoriteClientSchema.parse({
        ...req.body,
        userId
      });

      // Check if client already exists
      const existingClient = await storage.getFavoriteClientByCpf(clientData.cpf, userId);
      if (existingClient) {
        return res.status(409).json({ error: "Cliente já está nos favoritos" });
      }

      const client = await storage.createFavoriteClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Erro ao adicionar cliente favorito:", error);
      res.status(400).json({ error: "Dados inválidos para cliente favorito" });
    }
  });

  app.put("/api/favorite-clients/:id", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { id } = req.params;
      const clientData = updateFavoriteClientSchema.parse(req.body);

      const client = await storage.updateFavoriteClient(id, clientData);
      if (!client) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      res.json(client);
    } catch (error) {
      console.error("Erro ao atualizar cliente favorito:", error);
      res.status(400).json({ error: "Dados inválidos para atualização" });
    }
  });

  app.delete("/api/favorite-clients/:id", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFavoriteClient(id);

      if (!deleted) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      res.json({ message: "Cliente removido dos favoritos" });
    } catch (error) {
      console.error("Erro ao remover cliente favorito:", error);
      res.status(500).json({ error: "Erro ao remover cliente" });
    }
  });

  // Notifications management
  app.get("/api/notifications", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getNotificationsByUser(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Erro ao obter notificações:", error);
      res.status(500).json({ error: "Erro ao carregar notificações" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      res.status(500).json({ error: "Erro ao contar notificações" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { id } = req.params;
      const marked = await storage.markNotificationAsRead(id);

      if (!marked) {
        return res.status(404).json({ error: "Notificação não encontrada" });
      }

      res.json({ message: "Notificação marcada como lida" });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({ error: "Erro ao marcar notificação" });
    }
  });

  // Benefit monitoring
  app.get("/api/benefit-monitoring", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const monitoring = await storage.getBenefitMonitoringByUser(userId);
      res.json(monitoring);
    } catch (error) {
      console.error("Erro ao obter monitoramento de benefícios:", error);
      res.status(500).json({ error: "Erro ao carregar monitoramento" });
    }
  });

  app.post("/api/benefit-monitoring", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const monitoringData = createBenefitMonitoringSchema.parse({
        ...req.body,
        userId
      });

      const monitoring = await storage.createBenefitMonitoring(monitoringData);
      res.status(201).json(monitoring);
    } catch (error) {
      console.error("Erro ao criar monitoramento de benefício:", error);
      res.status(400).json({ error: "Dados inválidos para monitoramento" });
    }
  });

  // Admin route to get all consultations (for management reporting)
  app.get("/api/admin/consultations", requireAuthHybrid, requireManagerOrAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const consultations = await storage.getConsultationsByUser("", limit); // Empty string to get all
      res.json(consultations);
    } catch (error) {
      console.error("Erro ao obter todas as consultas:", error);
      res.status(500).json({ error: "Erro ao carregar consultas" });
    }
  });

  // Client markers routes - Sistema de marcação de clientes
  
  // Buscar marcação de um cliente por CPF
  app.get("/api/client-markers/:cpf", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { cpf } = req.params;
      const marker = await storage.getClientMarker(cpf);
      res.json(marker || null);
    } catch (error) {
      console.error("Erro ao buscar marcação do cliente:", error);
      res.status(500).json({ error: "Erro ao buscar marcação" });
    }
  });

  // Criar nova marcação de cliente
  app.post("/api/client-markers", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const user = req.user!;
      const markerData = insertClientMarkerSchema.parse({
        ...req.body,
        userId: user.id,
        userName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
      });

      const marker = await storage.createClientMarker(markerData);
      res.status(201).json(marker);
    } catch (error) {
      if ((error as any).code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          error: "Este cliente já possui uma marcação ativa" 
        });
      }
      console.error("Erro ao criar marcação:", error);
      res.status(400).json({ error: "Dados inválidos para marcação" });
    }
  });

  // Atualizar marcação de cliente
  app.put("/api/client-markers/:cpf", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { cpf } = req.params;
      const user = req.user!;
      
      // Verificar se a marcação existe e pertence ao usuário atual
      const existingMarker = await storage.getClientMarker(cpf);
      if (!existingMarker) {
        return res.status(404).json({ error: "Marcação não encontrada" });
      }
      
      // Verificar se o usuário pode editar: dono da marcação, quem assumiu a venda, ou administrador
      const canEdit = existingMarker.userId === user.id || 
                     existingMarker.assumedBy === user.id || 
                     user.role === "administrator";
      
      if (!canEdit) {
        return res.status(403).json({ 
          error: "Você só pode alterar marcações suas ou que tenha assumido" 
        });
      }

      // Sempre atualizar o userName com quem está fazendo a alteração
      const currentUserName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username;

      // Definir prazo de expiração para status "em_negociacao"
      const negotiationDurationHours = req.body.negotiationDurationHours || 2; // Padrão 2 horas
      const negotiationExpiresAt = req.body.status === 'em_negociacao' 
        ? new Date(Date.now() + negotiationDurationHours * 60 * 60 * 1000)
        : null;

      const updateData = {
        status: req.body.status,
        notes: req.body.notes,
        userName: currentUserName, // Sempre atualizar com quem está fazendo a mudança
        negotiationExpiresAt,
        negotiationDurationHours,
        // Se quem está editando assumiu a venda, manter informações de assumido
        ...(existingMarker.assumedBy === user.id ? {
          assumedBy: user.id,
          assumedByName: currentUserName,
        } : {})
      };

      // Se mudando para "em_negociacao", definir expiração
      if (req.body.status === 'em_negociacao' && existingMarker.status !== 'em_negociacao') {
        updateData.negotiationExpiresAt = new Date(Date.now() + negotiationDurationHours * 60 * 60 * 1000);
        updateData.negotiationDurationHours = negotiationDurationHours;
      }

      const marker = await storage.updateClientMarker(cpf, updateData);
      res.json(marker);
    } catch (error) {
      console.error("Erro ao atualizar marcação:", error);
      res.status(400).json({ error: "Erro ao atualizar marcação" });
    }
  });

  // Remover marcação de cliente (apenas administradores)
  app.delete("/api/client-markers/:cpf", requireAuthHybrid, async (req, res) => {
    try {
      const { cpf } = req.params;
      const user = req.user!;
      
      // Apenas administradores podem remover marcações
      if (user.role !== "administrator") {
        return res.status(403).json({ 
          error: "Acesso negado. Apenas administradores podem remover marcações." 
        });
      }

      const success = await storage.deleteClientMarker(cpf);
      if (success) {
        res.json({ message: "Marcação removida com sucesso" });
      } else {
        res.status(404).json({ error: "Marcação não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao remover marcação:", error);
      res.status(500).json({ error: "Erro ao remover marcação" });
    }
  });

  // Listar todas as marcações (apenas admins)
  app.get("/api/client-markers", requireAuthHybrid, requireManagerOrAdmin, async (req, res) => {
    try {
      const markers = await storage.getAllClientMarkers();
      res.json(markers);
    } catch (error) {
      console.error("Erro ao listar marcações:", error);
      res.status(500).json({ error: "Erro ao carregar marcações" });
    }
  });

  // Listar marcações do usuário atual
  app.get("/api/client-markers/user/me", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const userId = req.user!.id;
      const markers = await storage.getClientMarkersByUser(userId);
      res.json(markers);
    } catch (error) {
      console.error("Erro ao buscar marcações do usuário:", error);
      res.status(500).json({ error: "Erro ao carregar suas marcações" });
    }
  });

  // Assumir venda (operadores)
  app.post("/api/client-markers/:cpf/assume", requireAuthHybrid, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "operador") {
        return res.status(403).json({ error: "Acesso negado. Apenas operadores podem assumir vendas." });
      }

      const { cpf } = req.params;
      
      // Buscar marcação existente
      const existingMarker = await storage.getClientMarker(cpf);
      if (!existingMarker) {
        return res.status(404).json({ error: "Marcação não encontrada" });
      }

      // Verificar se o operador não é o mesmo que fez a marcação
      if (existingMarker.userId === user.id) {
        return res.status(400).json({ error: "Você não pode assumir sua própria venda" });
      }

      // Assumir a marcação usando o método específico
      const result = await storage.assumeClientMarker(cpf, user.id, user.firstName || user.username);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ 
        message: "Venda assumida com sucesso", 
        notificationSent: result.notificationSent 
      });
    } catch (error) {
      console.error("Error assuming sale:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Listar clientes não marcados pelo usuário atual (operadores)
  app.get("/api/client-markers/unmarked", requireAuthHybrid, async (req, res) => {
    try {
      const user = req.user!;
      
      // Buscar clientes consultados pelo usuário que não foram marcados
      const unmarkedClients = await storage.getUnmarkedClients(user.id);
      
      res.json(unmarkedClients);
    } catch (error) {
      console.error("Erro ao buscar clientes não marcados:", error);
      res.status(500).json({ error: "Erro ao carregar clientes não marcados" });
    }
  });

  // Buscar histórico de marcações de um cliente por CPF
  app.get("/api/client-markers/:cpf/history", requireAuthHybrid, requireAnyRole, async (req, res) => {
    try {
      const { cpf } = req.params;
      const history = await storage.getClientMarkerHistory(cpf);
      res.json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico de marcações:", error);
      res.status(500).json({ error: "Erro ao carregar histórico" });
    }
  });

  // Configurar verificação automática de negociações expiradas (a cada 1 minuto para teste)
  setInterval(async () => {
    try {
      await storage.checkExpiredNegotiations();
    } catch (error) {
      console.error('Erro na verificação automática de expiração:', error);
    }
  }, 1 * 60 * 1000); // 1 minuto para teste

  // Executar verificação inicial após 30 segundos
  setTimeout(async () => {
    try {
      await storage.checkExpiredNegotiations();
    } catch (error) {
      console.error('Erro na verificação inicial de expiração:', error);
    }
  }, 30 * 1000); // 30 segundos

  // Endpoint para teste manual de expiração
  app.post("/api/admin/expire-negotiations", requireAuthHybrid, requireManagerOrAdmin, async (req, res) => {
    try {
      await storage.checkExpiredNegotiations();
      res.json({ message: "Verificação de expiração executada com sucesso" });
    } catch (error) {
      console.error("Erro na verificação manual de expiração:", error);
      res.status(500).json({ error: "Erro ao verificar expirações" });
    }
  });

  // Dashboard de controle para gerentes/administradores - clientes em negociação
  app.get("/api/admin/negotiations-control", requireAuthHybrid, requireManagerOrAdmin, async (req, res) => {
    try {
      const activeNegotiations = await storage.getActiveNegotiations();
      res.json(activeNegotiations);
    } catch (error) {
      console.error("Erro ao obter controle de negociações:", error);
      res.status(500).json({ error: "Erro ao carregar controle de negociações" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}