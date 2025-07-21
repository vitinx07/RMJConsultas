import { storage } from "./storage";
import { addDays, differenceInDays, isAfter, isBefore } from "date-fns";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

export class PasswordExpiryService {
  private readonly PASSWORD_VALIDITY_DAYS = 30;
  private readonly WARNING_DAYS = [3, 2, 1]; // Dias antes da expiração para enviar alertas

  /**
   * Calcula a data de expiração da senha (30 dias a partir da data atual)
   */
  private calculatePasswordExpiryDate(): Date {
    return addDays(new Date(), this.PASSWORD_VALIDITY_DAYS);
  }

  /**
   * Verifica se a senha está expirada
   */
  isPasswordExpired(passwordExpiresAt: Date | null): boolean {
    if (!passwordExpiresAt) return false;
    return isAfter(new Date(), new Date(passwordExpiresAt));
  }

  /**
   * Verifica quantos dias restam para a senha expirar
   */
  getDaysUntilExpiry(passwordExpiresAt: Date | null): number {
    if (!passwordExpiresAt) return -1;
    return differenceInDays(new Date(passwordExpiresAt), new Date());
  }

  /**
   * Verifica se deve mostrar alerta de expiração
   */
  shouldShowExpiryWarning(passwordExpiresAt: Date | null): boolean {
    if (!passwordExpiresAt) return false;
    const daysLeft = this.getDaysUntilExpiry(passwordExpiresAt);
    return this.WARNING_DAYS.includes(daysLeft);
  }

  /**
   * Obtém a mensagem de alerta baseada nos dias restantes
   */
  getExpiryWarningMessage(passwordExpiresAt: Date | null): string {
    if (!passwordExpiresAt) return "";
    
    const daysLeft = this.getDaysUntilExpiry(passwordExpiresAt);
    
    if (daysLeft === 3) {
      return "Sua senha expirará em 3 dias. Altere sua senha para continuar usando o sistema.";
    } else if (daysLeft === 2) {
      return "Sua senha expirará em 2 dias. Altere sua senha urgentemente!";
    } else if (daysLeft === 1) {
      return "Sua senha expirará amanhã! Altere sua senha agora para evitar bloqueio.";
    } else if (daysLeft === 0) {
      return "Sua senha expirou hoje. Você deve alterar sua senha para continuar.";
    }
    
    return "";
  }

  /**
   * Define nova data de expiração quando senha é alterada
   */
  async setNewPasswordExpiry(userId: string): Promise<void> {
    const newExpiryDate = this.calculatePasswordExpiryDate();
    await db
      .update(users)
      .set({
        passwordExpiresAt: newExpiryDate,
        passwordCreatedAt: new Date(),
        lastPasswordChange: new Date(),
        mustChangePassword: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Força expiração da senha (marca como deve alterar)
   */
  async forcePasswordExpiry(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        mustChangePassword: true,
        passwordExpiresAt: new Date(), // Expira imediatamente
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Verifica todos os usuários e processa expirações
   */
  async processPasswordExpirations(): Promise<void> {
    console.log("🔄 Processando verificação de expiração de senhas...");
    
    try {
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        if (!user.isActive) continue; // Pula usuários inativos
        
        // Se não tem data de expiração definida, define uma
        if (!user.passwordExpiresAt) {
          await this.setNewPasswordExpiry(user.id);
          console.log(`📅 Data de expiração definida para usuário ${user.username}`);
          continue;
        }

        // Verifica se a senha está expirada
        if (this.isPasswordExpired(user.passwordExpiresAt)) {
          await this.forcePasswordExpiry(user.id);
          console.log(`🔒 Senha expirada forçada para usuário ${user.username}`);
          
          // Criar notificação de senha expirada
          await storage.createNotification({
            userId: user.id,
            type: "security",
            title: "Senha Expirada",
            message: "Sua senha expirou e deve ser alterada imediatamente para continuar usando o sistema.",
            isRead: false
          });
        }
        // Verifica se deve criar alerta de expiração próxima
        else if (this.shouldShowExpiryWarning(user.passwordExpiresAt)) {
          const daysLeft = this.getDaysUntilExpiry(user.passwordExpiresAt);
          const message = this.getExpiryWarningMessage(user.passwordExpiresAt);
          
          // Verifica se já existe uma notificação similar hoje
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const existingNotifications = await storage.getNotificationsByUser(user.id, 5);
          const hasAlertToday = existingNotifications.some(notification => {
            const notifDate = new Date(notification.createdAt!);
            notifDate.setHours(0, 0, 0, 0);
            return notifDate.getTime() === today.getTime() && 
                   notification.title.includes("Senha Expirará");
          });

          if (!hasAlertToday) {
            await storage.createNotification({
              userId: user.id,
              type: "warning",
              title: `Senha Expirará em ${daysLeft} ${daysLeft === 1 ? 'Dia' : 'Dias'}`,
              message: message,
              isRead: false
            });
            
            console.log(`⚠️ Alerta de expiração criado para usuário ${user.username} (${daysLeft} dias)`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Erro ao processar expirações de senha:", error);
    }
  }

  /**
   * Inicia o serviço de verificação automática
   */
  startPeriodicCheck(): void {
    console.log("🚀 Iniciando verificação periódica de expiração de senhas...");
    
    // Executa imediatamente
    this.processPasswordExpirations();
    
    // Executa a cada 24 horas (86400000 ms)
    setInterval(() => {
      this.processPasswordExpirations();
    }, 24 * 60 * 60 * 1000);
    
    // Para desenvolvimento, também executa a cada 5 minutos para testar
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        this.processPasswordExpirations();
      }, 5 * 60 * 1000); // 5 minutos
    }
  }
}

export const passwordExpiryService = new PasswordExpiryService();