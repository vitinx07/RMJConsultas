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
  resetPasswordSchema
} from "@shared/schema";
import { banrisulApi, BanrisulApiError } from "./banrisul-api";
import { generateJWT, requireAuthHybrid } from "./jwt-auth";
import { randomBytes } from "crypto";
import { emailService } from "./email";


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

  // Send custom email (admin only)
  app.post("/api/admin/send-email", requireAuthHybrid, requireAdmin, async (req, res) => {
    try {
      const { recipients, subject, message, isHtml, attachments } = req.body;

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
          const success = await emailService.sendCustomEmail(email, subject, message, isHtml, processedAttachments);
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
              loanBlocked: beneficiary.BloqueadoEmprestimo === "S",
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
            loanBlocked: beneficiary.BloqueadoEmprestimo === "S",
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
      const limit = parseInt(req.query.limit as string) || 50;
      const consultations = await storage.getConsultationsByUser(userId, limit);
      res.json(consultations);
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

  const httpServer = createServer(app);
  return httpServer;
}