import {
  users,
  sessions,
  consultations,
  favoriteClients,
  notifications,
  benefitMonitoring,
  passwordResetTokens,
  clientMarkers,
  clientMarkerHistory,
  type User,
  type CreateUser,
  type UpdateUser,
  type Consultation,
  type CreateConsultation,
  type FavoriteClient,
  type CreateFavoriteClient,
  type UpdateFavoriteClient,
  type Notification,
  type CreateNotification,
  type BenefitMonitoring,
  type CreateBenefitMonitoring,
  type DashboardStats,
  type SelectClientMarker,
  type InsertClientMarker,
  type ClientMarkerStatus,
  type ClientMarkerHistory,
  type InsertClientMarkerHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql, count, inArray, isNull, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { emailService } from "./email";

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByIds(ids: string[]): Promise<User[]>;
  createUser(userData: CreateUser, creatorId?: string): Promise<User>;
  updateUser(id: string, userData: UpdateUser): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  validateCredentials(username: string, password: string): Promise<User | null>;
  createAdminUser(): Promise<void>;
  resetUserPassword(userId: string, newPassword?: string): Promise<{ user: User; password: string }>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;
  
  // Password reset tokens
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ id: string; userId: string; used: boolean; expiresAt: Date } | undefined>;
  markPasswordResetTokenAsUsed(tokenId: string): Promise<void>;

  // Consultation operations
  createConsultation(consultationData: CreateConsultation): Promise<Consultation>;
  getConsultationsByUser(userId: string, limit?: number): Promise<Consultation[]>;
  getConsultationByCpf(cpf: string, userId?: string): Promise<Consultation | undefined>;
  getConsultationByBenefit(benefitNumber: string, userId?: string): Promise<Consultation | undefined>;
  
  // Favorite clients operations
  createFavoriteClient(clientData: CreateFavoriteClient): Promise<FavoriteClient>;
  getFavoriteClientsByUser(userId: string): Promise<FavoriteClient[]>;
  updateFavoriteClient(id: string, clientData: UpdateFavoriteClient): Promise<FavoriteClient | undefined>;
  deleteFavoriteClient(id: string): Promise<boolean>;
  getFavoriteClientByCpf(cpf: string, userId: string): Promise<FavoriteClient | undefined>;
  
  // Notifications operations
  createNotification(notificationData: CreateNotification): Promise<Notification>;
  getNotificationsByUser(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  
  // Benefit monitoring operations
  createBenefitMonitoring(monitoringData: CreateBenefitMonitoring): Promise<BenefitMonitoring>;
  getBenefitMonitoringByUser(userId: string): Promise<BenefitMonitoring[]>;
  updateBenefitMonitoring(id: string, lastStatus: string, lastMargin?: number, lastBlocked?: boolean, lastBlockReason?: string): Promise<BenefitMonitoring | undefined>;
  getBenefitMonitoringForCheck(): Promise<BenefitMonitoring[]>;
  
  // Dashboard operations
  getDashboardStats(userId?: string, filters?: { startDate?: string; endDate?: string }): Promise<DashboardStats>;
  
  // Client markers for preventing simultaneous negotiations
  getClientMarker(cpf: string): Promise<SelectClientMarker | undefined>;
  createClientMarker(markerData: InsertClientMarker): Promise<SelectClientMarker>;
  updateClientMarker(cpf: string, markerData: Partial<InsertClientMarker>): Promise<SelectClientMarker | undefined>;
  deleteClientMarker(cpf: string): Promise<boolean>;
  getAllClientMarkers(): Promise<SelectClientMarker[]>;
  getClientMarkersByUser(userId: string): Promise<SelectClientMarker[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    
    // Get users one by one to avoid SQL array issues
    const userPromises = ids.map(id => this.getUserById(id));
    const userResults = await Promise.all(userPromises);
    
    // Filter out undefined results
    return userResults.filter((user): user is User => user !== undefined);
  }

  async createUser(userData: CreateUser, creatorId?: string): Promise<User> {
    let password = userData.password;
    
    // Generate password if requested
    if (userData.generatePassword) {
      password = this.generateRandomPassword();
    }
    
    if (!password) {
      throw new Error("Senha é obrigatória");
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: userData.isActive,
        passwordHash: hashedPassword,
        mustChangePassword: userData.generatePassword || false, // Força mudança de senha se foi gerada automaticamente
        passwordExpiresAt: userData.generatePassword ? new Date() : (() => {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          return expiry;
        })(), // Se senha gerada, expira imediatamente, senão 30 dias
        lastPasswordChange: new Date(),
        createdBy: creatorId,
        updatedAt: new Date(),
      })
      .returning();
    
    // Send password by email if requested and email is provided
    if (userData.sendPasswordByEmail && userData.email && password) {
      try {
        await emailService.sendPasswordEmail(userData.email, password, userData.username);
      } catch (error) {
        console.error("Erro ao enviar email:", error);
        // Don't throw error, user was created successfully
      }
    }
    
    return user;
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async resetUserPassword(userId: string, newPassword?: string): Promise<{ user: User; password: string }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const password = newPassword || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        mustChangePassword: true, // Forçar mudança de senha temporária
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Send password by email if user has email
    if (user.email) {
      try {
        await emailService.sendPasswordResetEmail(user.email, user.username, password);
      } catch (error) {
        console.error("Erro ao enviar email de redefinição:", error);
      }
    }

    return { user: updatedUser, password };
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async validateCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  async createAdminUser(): Promise<void> {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByUsername("Vitor.admin");
    if (existingAdmin) {
      return;
    }

    // Create the default admin user with a properly hashed password
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const [user] = await db
      .insert(users)
      .values({
        username: "Vitor.admin",
        passwordHash: hashedPassword,
        role: "administrator",
        firstName: "Vitor",
        lastName: "Administrator",
        email: "cavalcantisilvav@gmail.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    console.log("✅ Usuário administrador criado com senha: admin123");
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    
    // Calcula nova data de expiração (30 dias a partir de agora)
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 30);
    
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        passwordExpiresAt: passwordExpiresAt,
        lastPasswordChange: now,
        mustChangePassword: false, // Remover obrigação após mudança
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }

  // Password reset tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ id: string; userId: string; used: boolean; expiresAt: Date } | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    
    return resetToken ? {
      id: resetToken.id,
      userId: resetToken.userId,
      used: resetToken.used || false,
      expiresAt: resetToken.expiresAt
    } : undefined;
  }

  async markPasswordResetTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  // Consultation operations
  async createConsultation(consultationData: CreateConsultation): Promise<Consultation> {
    const [consultation] = await db
      .insert(consultations)
      .values(consultationData)
      .returning();
    return consultation;
  }

  async getConsultationsByUser(userId: string, limit: number = 50): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.userId, userId))
      .orderBy(desc(consultations.createdAt))
      .limit(limit);
  }

  async getConsultationByCpf(cpf: string, userId?: string): Promise<Consultation | undefined> {
    const conditions = [eq(consultations.cpf, cpf)];
    if (userId) {
      conditions.push(eq(consultations.userId, userId));
    }
    
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(and(...conditions))
      .orderBy(desc(consultations.createdAt))
      .limit(1);
    
    return consultation;
  }

  async getConsultationByBenefit(benefitNumber: string, userId?: string): Promise<Consultation | undefined> {
    const conditions = [eq(consultations.benefitNumber, benefitNumber)];
    if (userId) {
      conditions.push(eq(consultations.userId, userId));
    }
    
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(and(...conditions))
      .orderBy(desc(consultations.createdAt))
      .limit(1);
    
    return consultation;
  }

  // Favorite clients operations
  async createFavoriteClient(clientData: CreateFavoriteClient): Promise<FavoriteClient> {
    const [client] = await db
      .insert(favoriteClients)
      .values({
        ...clientData,
        updatedAt: new Date(),
      })
      .returning();
    return client;
  }

  async getFavoriteClientsByUser(userId: string): Promise<FavoriteClient[]> {
    return await db
      .select()
      .from(favoriteClients)
      .where(eq(favoriteClients.userId, userId))
      .orderBy(desc(favoriteClients.updatedAt));
  }

  async updateFavoriteClient(id: string, clientData: UpdateFavoriteClient): Promise<FavoriteClient | undefined> {
    const [client] = await db
      .update(favoriteClients)
      .set({
        ...clientData,
        updatedAt: new Date(),
      })
      .where(eq(favoriteClients.id, id))
      .returning();
    
    return client;
  }

  async deleteFavoriteClient(id: string): Promise<boolean> {
    const result = await db.delete(favoriteClients).where(eq(favoriteClients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getFavoriteClientByCpf(cpf: string, userId: string): Promise<FavoriteClient | undefined> {
    const [client] = await db
      .select()
      .from(favoriteClients)
      .where(and(eq(favoriteClients.cpf, cpf), eq(favoriteClients.userId, userId)))
      .limit(1);
    
    return client;
  }

  // Notifications operations
  async createNotification(notificationData: CreateNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result[0]?.count || 0;
  }

  // Benefit monitoring operations
  async createBenefitMonitoring(monitoringData: CreateBenefitMonitoring): Promise<BenefitMonitoring> {
    const [monitoring] = await db
      .insert(benefitMonitoring)
      .values(monitoringData)
      .returning();
    return monitoring;
  }

  async getBenefitMonitoringByUser(userId: string): Promise<BenefitMonitoring[]> {
    return await db
      .select()
      .from(benefitMonitoring)
      .where(and(eq(benefitMonitoring.userId, userId), eq(benefitMonitoring.isActive, true)))
      .orderBy(desc(benefitMonitoring.createdAt));
  }

  async updateBenefitMonitoring(
    id: string,
    lastStatus: string,
    lastMargin?: number,
    lastBlocked?: boolean,
    lastBlockReason?: string
  ): Promise<BenefitMonitoring | undefined> {
    const [monitoring] = await db
      .update(benefitMonitoring)
      .set({
        lastStatus,
        lastMargin: lastMargin?.toString(),
        lastBlocked,
        lastBlockReason,
        lastCheck: new Date(),
      })
      .where(eq(benefitMonitoring.id, id))
      .returning();
    
    return monitoring;
  }

  async getBenefitMonitoringForCheck(): Promise<BenefitMonitoring[]> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // 24 horas atrás
    
    return await db
      .select()
      .from(benefitMonitoring)
      .where(and(
        eq(benefitMonitoring.isActive, true),
        lte(benefitMonitoring.lastCheck, cutoff)
      ));
  }

  // Dashboard operations
  async getDashboardStats(userId?: string, filters?: { startDate?: string; endDate?: string }): Promise<DashboardStats> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Base conditions
    const userCondition = userId ? eq(consultations.userId, userId) : sql`true`;
    
    // Date filters
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(gte(consultations.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include full end date
      dateConditions.push(lte(consultations.createdAt, endDate));
    }
    
    const baseCondition = dateConditions.length > 0 
      ? and(userCondition, ...dateConditions)
      : userCondition;

    // Total consultations
    const totalConsultationsResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(baseCondition);

    // Consultations today
    const consultationsTodayResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(userCondition, gte(consultations.createdAt, startOfDay)));

    // Consultations this week
    const consultationsWeekResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(userCondition, gte(consultations.createdAt, startOfWeek)));

    // Consultations this month
    const consultationsMonthResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(userCondition, gte(consultations.createdAt, startOfMonth)));

    // Consultations by type
    const consultationsByCpfResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(baseCondition, eq(consultations.searchType, 'cpf')));

    const consultationsByBenefitResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(baseCondition, eq(consultations.searchType, 'beneficio')));

    // Favorite clients
    const favoriteClientsResult = await db
      .select({ count: count() })
      .from(favoriteClients)
      .where(userId ? eq(favoriteClients.userId, userId) : sql`true`);

    // Unread notifications
    const unreadNotificationsResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        userId ? eq(notifications.userId, userId) : sql`true`,
        eq(notifications.isRead, false)
      ));

    // Top users (only for admins/managers)
    const topUsersResult = !userId ? await db
      .select({
        userId: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        consultationCount: count(consultations.id),
      })
      .from(users)
      .leftJoin(consultations, eq(users.id, consultations.userId))
      .groupBy(users.id, users.username, users.firstName, users.lastName)
      .orderBy(desc(count(consultations.id)))
      .limit(10) : [];

    // Blocked loans count
    const blockedLoansResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(baseCondition, eq(consultations.loanBlocked, true)));

    // Unblocked loans count
    const unblockedLoansResult = await db
      .select({ count: count() })
      .from(consultations)
      .where(and(baseCondition, eq(consultations.loanBlocked, false)));

    // Average margin
    const averageMarginResult = await db
      .select({ avg: sql<number>`AVG(${consultations.availableMargin})` })
      .from(consultations)
      .where(and(baseCondition, sql`${consultations.availableMargin} IS NOT NULL`));

    return {
      totalConsultations: totalConsultationsResult[0]?.count || 0,
      consultationsToday: consultationsTodayResult[0]?.count || 0,
      consultationsThisWeek: consultationsWeekResult[0]?.count || 0,
      consultationsThisMonth: consultationsMonthResult[0]?.count || 0,
      consultationsByCpf: consultationsByCpfResult[0]?.count || 0,
      consultationsByBenefit: consultationsByBenefitResult[0]?.count || 0,
      favoriteClients: favoriteClientsResult[0]?.count || 0,
      unreadNotifications: unreadNotificationsResult[0]?.count || 0,
      topUsers: topUsersResult.map(user => ({
        userId: user.userId,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        consultationCount: user.consultationCount,
      })),
      marginDistribution: [], // Implement if needed
      blockedLoansCount: blockedLoansResult[0]?.count || 0,
      unblockedLoansCount: unblockedLoansResult[0]?.count || 0,
      averageMargin: averageMarginResult[0]?.avg || 0,
    };
  }

  // Client markers operations
  async getClientMarker(cpf: string): Promise<SelectClientMarker | undefined> {
    const [marker] = await db
      .select()
      .from(clientMarkers)
      .where(eq(clientMarkers.cpf, cpf.replace(/\D/g, ''))); // Remove formatação do CPF
    
    return marker;
  }



  async createClientMarker(markerData: InsertClientMarker): Promise<SelectClientMarker> {
    // Remove formatação do CPF
    const cleanCpf = markerData.cpf.replace(/\D/g, '');
    
    const [marker] = await db
      .insert(clientMarkers)
      .values({
        ...markerData,
        cpf: cleanCpf,
      })
      .returning();
    
    // Criar histórico da criação
    await this.createClientMarkerHistory({
      cpf: cleanCpf,
      clientName: undefined,
      status: markerData.status,
      userId: markerData.userId,
      userName: markerData.userName,
      action: 'created',
      notes: markerData.notes,
    });
    
    return marker;
  }

  async updateClientMarker(cpf: string, markerData: Partial<any>): Promise<SelectClientMarker | undefined> {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Buscar marcação atual para histórico
    const currentMarker = await this.getClientMarker(cleanCpf);
    
    const [marker] = await db
      .update(clientMarkers)
      .set({
        ...markerData,
        updatedAt: new Date(),
      })
      .where(eq(clientMarkers.cpf, cleanCpf))
      .returning();
    
    // Criar histórico da atualização se há mudanças significativas
    if (marker && currentMarker && (
      markerData.status !== currentMarker.status || 
      markerData.notes !== currentMarker.notes
    )) {
      await this.createClientMarkerHistory({
        cpf: cleanCpf,
        clientName: undefined,
        status: marker.status,
        userId: marker.userId,
        userName: markerData.userName || marker.userName, // Usar o userName dos dados de atualização
        action: 'updated',
        notes: marker.notes,
        previousUserId: currentMarker.userId,
        previousUserName: currentMarker.userName,
        previousStatus: currentMarker.status,
      });
    }
    
    return marker;
  }

  async deleteClientMarker(cpf: string): Promise<boolean> {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Buscar marcação atual para histórico
    const currentMarker = await this.getClientMarker(cleanCpf);
    
    const result = await db
      .delete(clientMarkers)
      .where(eq(clientMarkers.cpf, cleanCpf));
    
    // Criar histórico da remoção
    if (currentMarker && (result.rowCount || 0) > 0) {
      await this.createClientMarkerHistory({
        cpf: cleanCpf,
        clientName: undefined,
        status: currentMarker.status,
        userId: currentMarker.userId,
        userName: currentMarker.userName,
        action: 'removed',
        notes: currentMarker.notes,
      });
    }
    
    return (result.rowCount || 0) > 0;
  }

  async getAllClientMarkers(): Promise<SelectClientMarker[]> {
    return await db
      .select()
      .from(clientMarkers)
      .orderBy(desc(clientMarkers.createdAt));
  }

  async getClientMarkersByUser(userId: string): Promise<SelectClientMarker[]> {
    return await db
      .select()
      .from(clientMarkers)
      .where(eq(clientMarkers.userId, userId))
      .orderBy(desc(clientMarkers.createdAt));
  }

  // Client marker history operations
  async createClientMarkerHistory(historyData: InsertClientMarkerHistory): Promise<ClientMarkerHistory> {
    const [history] = await db
      .insert(clientMarkerHistory)
      .values(historyData)
      .returning();
    
    return history;
  }

  async getClientMarkerHistory(cpf: string): Promise<ClientMarkerHistory[]> {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    return await db
      .select()
      .from(clientMarkerHistory)
      .where(eq(clientMarkerHistory.cpf, cleanCpf))
      .orderBy(desc(clientMarkerHistory.createdAt));
  }

  // Funcionalidades adicionais para marcação
  async getUnmarkedClients(userId: string): Promise<Array<{ cpf: string; beneficiaryName: string; lastConsultation: Date }>> {
    // Buscar consultas do usuário que não têm marcação
    const unmarkedConsultations = await db
      .select({
        cpf: consultations.cpf,
        beneficiaryName: sql<string>`${consultations.resultData}->>'beneficiaryName'`,
        lastConsultation: consultations.createdAt,
      })
      .from(consultations)
      .leftJoin(clientMarkers, eq(consultations.cpf, clientMarkers.cpf))
      .where(
        and(
          eq(consultations.userId, userId),
          isNull(clientMarkers.cpf), // Não tem marcação
          gte(consultations.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Últimos 7 dias
        )
      )
      .orderBy(desc(consultations.createdAt));

    return unmarkedConsultations.filter(item => item.lastConsultation !== null) as Array<{ cpf: string; beneficiaryName: string; lastConsultation: Date }>;
  }

  async assumeClientMarker(cpf: string, newUserId: string, newUserName: string): Promise<{ success: boolean; notificationSent: boolean; error?: string }> {
    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      const currentMarker = await this.getClientMarker(cleanCpf);
      
      if (!currentMarker) {
        return { success: false, notificationSent: false, error: "Marcação não encontrada" };
      }

      // Atualizar a marcação
      const [updatedMarker] = await db
        .update(clientMarkers)
        .set({
          assumedBy: newUserId,
          assumedByName: newUserName,
          updatedAt: new Date(),
        })
        .where(eq(clientMarkers.cpf, cleanCpf))
        .returning();

      // Criar histórico da assunção
      await this.createClientMarkerHistory({
        cpf: cleanCpf,
        clientName: undefined,
        status: currentMarker.status,
        userId: newUserId,
        userName: newUserName,
        action: 'assumed',
        previousUserId: currentMarker.userId,
        previousUserName: currentMarker.userName,
        previousStatus: currentMarker.status,
      });

      // Enviar notificações apenas se o status for "em_negociacao"
      let notificationSent = false;
      if (currentMarker.status === 'em_negociacao') {
        try {
          // Notificar operador anterior
          await this.createNotification({
            userId: currentMarker.userId,
            type: 'client_marker_assumed',
            title: 'Venda Assumida',
            message: `${newUserName} assumiu a negociação do cliente CPF ${cleanCpf}`,
            cpf: cleanCpf,
            metadata: {
              assumedBy: newUserId,
              assumedByName: newUserName,
              originalStatus: currentMarker.status
            }
          });

          // Notificar gerentes e administradores
          const managersAndAdmins = await db
            .select()
            .from(users)
            .where(or(eq(users.role, 'administrator'), eq(users.role, 'gerente')));

          for (const admin of managersAndAdmins) {
            await this.createNotification({
              userId: admin.id,
              type: 'client_marker_assumed',
              title: 'Venda Assumida por Operador',
              message: `${newUserName} assumiu a negociação do cliente CPF ${cleanCpf} de ${currentMarker.userName}`,
              cpf: cleanCpf,
              metadata: {
                assumedBy: newUserId,
                assumedByName: newUserName,
                originalUserId: currentMarker.userId,
                originalUserName: currentMarker.userName,
                originalStatus: currentMarker.status
              }
            });
          }
          
          notificationSent = true;
        } catch (notifError) {
          console.error('Erro ao enviar notificação:', notifError);
        }
      }

      return { success: true, notificationSent };
    } catch (error) {
      console.error('Erro ao assumir marcação:', error);
      return { success: false, notificationSent: false, error: (error as Error).message };
    }
  }

  async getUnmarkedClientsByUser(userId: string): Promise<any[]> {
    // Buscar todas as consultas do usuário que não possuem marcação
    const unmarkedClients = await db
      .select({
        cpf: consultations.cpf,
        beneficiaryName: consultations.beneficiaryName,
        benefitNumber: consultations.benefitNumber,
        createdAt: consultations.createdAt,
      })
      .from(consultations)
      .leftJoin(clientMarkers, eq(consultations.cpf, clientMarkers.cpf))
      .where(and(
        eq(consultations.userId, userId),
        isNull(clientMarkers.id) // Não existe marcação para este CPF
      ))
      .groupBy(consultations.cpf, consultations.beneficiaryName, consultations.benefitNumber, consultations.createdAt)
      .orderBy(desc(consultations.createdAt));

    return unmarkedClients;
  }
}

export const storage = new DatabaseStorage();
