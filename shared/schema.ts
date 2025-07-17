import { z } from "zod";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  uuid,
  index,
  jsonb,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const beneficiarySchema = z.object({
  Nome: z.string(),
  CPF: z.string(),
  DataNascimento: z.string(),
  Beneficio: z.string(),
  Situacao: z.string(),
  DIB: z.string(),
  DDB: z.string(),
  NomeMae: z.string(),
  Rg: z.string(),
  Sexo: z.string(),
  Especie: z.string(),
  PA: z.string(),
  RL: z.string(),
  BloqueadoEmprestimo: z.string(),
  PermiteEmprestimo: z.string(),
  UF: z.string(),
  UFBeneficio: z.string(),
  Endereco: z.string(),
  Bairro: z.string(),
  Cidade: z.string(),
  CEP: z.string(),
  MotivoBloqueio: z.string().nullable(),
});

export const financialSummarySchema = z.object({
  ValorBeneficio: z.number(),
  BaseCalculo: z.number(),
  MargemDisponivelEmprestimo: z.number(),
  MargemDisponivelRmc: z.number(),
  MargemDisponivelRcc: z.number(),
  TotalEmprestimos: z.number(),
  TotalParcelas: z.number(),
  TotalContrato: z.number(),
  PossuiCartao: z.boolean(),
  DescontoAssociacao: z.number(),
});

export const bankingDataSchema = z.object({
  AgenciaPagto: z.string(),
  Agencia: z.string(),
  Banco: z.string(),
  ContaPagto: z.string(),
  MeioPagamento: z.string(),
  UF: z.string().nullable(),
  Cep: z.string().nullable(),
});

export const loanSchema = z.object({
  Banco: z.string().optional(),
  NomeBanco: z.string().optional(),
  CodigoBanco: z.string().optional(),
  ValorParcela: z.number().default(0),
  Quitacao: z.number().default(0),
  Prazo: z.string().optional(),
  Tipo: z.string().optional(),
  Taxa: z.number().default(0),
  ParcelasRestantes: z.string().optional(),
  Contrato: z.string().optional(),
  ValorEmprestimo: z.number().default(0),
  ValorLiberado: z.number().default(0),
  DataAverbacao: z.string().optional(),
  InicioDesconto: z.string().optional(),
  FinalDesconto: z.string().optional(),
  CetMensal: z.number().nullable(),
  CetAnual: z.number().nullable(),
  iof: z.number().nullable(),
  taxaAnual: z.number().nullable(),
  taxaMensal: z.number().nullable(),
});

export const benefitSchema = z.object({
  Beneficiario: beneficiarySchema,
  ResumoFinanceiro: financialSummarySchema,
  DadosRepresentante: z.array(z.object({
    Nome: z.string(),
    CPF: z.string(),
    Parentesco: z.string(),
    Telefone: z.string().optional(),
    Email: z.string().optional(),
  })).optional(),
  DadosBancarios: bankingDataSchema,
  Rmc: z.object({
    Banco: z.string(),
    NomeBanco: z.string(),
    Valor: z.number(),
    ValorParcela: z.number(),
    Contrato: z.string(),
    Valor_emprestimo: z.number(),
    Data_inclusao: z.string(),
  }).optional(),
  RCC: z.object({
    Banco: z.string(),
    NomeBanco: z.string().optional(),
    Valor: z.number(),
    ValorParcela: z.number().optional(),
    Contrato: z.string(),
    Valor_emprestimo: z.number(),
    Data_inclusao: z.string(),
  }).optional(),
  Associacao: z.array(z.unknown()).or(z.object({
    TaxaAssociativa: z.string(),
    Parcela: z.number(),
  })),
  Emprestimos: z.array(loanSchema),
  AumentoSalario: z.number(),
  AumentoMargem: z.string(),
  PdfBase64: z.string().nullable(),
});

export const searchRequestSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória"),
  searchType: z.enum(["cpf", "beneficio"]),
  searchValue: z.string().min(1, "Valor de busca é obrigatório"),
});

// Database Tables for User Management
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 100 }).unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("vendedor"), // administrator, gerente, vendedor
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by"),
});

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Histórico de Consultas
export const consultations = pgTable("consultations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  searchType: varchar("search_type", { length: 20 }).notNull(), // "cpf" ou "beneficio"
  searchValue: varchar("search_value", { length: 50 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  benefitNumber: varchar("benefit_number", { length: 20 }).notNull(),
  beneficiaryName: varchar("beneficiary_name", { length: 200 }).notNull(),
  benefitValue: decimal("benefit_value", { precision: 10, scale: 2 }),
  availableMargin: decimal("available_margin", { precision: 10, scale: 2 }),
  loanBlocked: boolean("loan_blocked").default(false),
  blockReason: text("block_reason"),
  resultData: jsonb("result_data").notNull(), // Dados completos da consulta
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_consultations_user").on(table.userId),
  index("idx_consultations_cpf").on(table.cpf),
  index("idx_consultations_created").on(table.createdAt),
]);

// Clientes Favoritos (CRM Simplificado)
export const favoriteClients = pgTable("favorite_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  benefitNumber: varchar("benefit_number", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("contactado"), // "contactado", "negociacao", "finalizado"
  lastConsultation: timestamp("last_consultation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_favorite_clients_user").on(table.userId),
  index("idx_favorite_clients_cpf").on(table.cpf),
  index("idx_favorite_clients_status").on(table.status),
]);

// Notificações do Sistema
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "benefit_status_change", "margin_increase", "system_alert"
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  benefitNumber: varchar("benefit_number", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"), // Dados extras da notificação
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_read").on(table.isRead),
  index("idx_notifications_created").on(table.createdAt),
]);

// Monitoramento de Benefícios (para notificações automáticas)
export const benefitMonitoring = pgTable("benefit_monitoring", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  benefitNumber: varchar("benefit_number", { length: 20 }).notNull(),
  lastStatus: varchar("last_status", { length: 50 }).notNull(),
  lastMargin: decimal("last_margin", { precision: 10, scale: 2 }),
  lastBlocked: boolean("last_blocked").default(false),
  lastBlockReason: text("last_block_reason"),
  isActive: boolean("is_active").default(true),
  checkFrequency: integer("check_frequency").default(24), // horas
  lastCheck: timestamp("last_check").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_benefit_monitoring_user").on(table.userId),
  index("idx_benefit_monitoring_cpf").on(table.cpf),
  index("idx_benefit_monitoring_active").on(table.isActive),
  index("idx_benefit_monitoring_check").on(table.lastCheck),
]);

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  createdUsers: many(users, { relationName: "creator" }),
  creator: one(users, {
    fields: [users.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
  consultations: many(consultations),
  favoriteClients: many(favoriteClients),
  notifications: many(notifications),
  benefitMonitoring: many(benefitMonitoring),
}));

// Consultation relations
export const consultationsRelations = relations(consultations, ({ one }) => ({
  user: one(users, {
    fields: [consultations.userId],
    references: [users.id],
  }),
}));

// Favorite clients relations
export const favoriteClientsRelations = relations(favoriteClients, ({ one }) => ({
  user: one(users, {
    fields: [favoriteClients.userId],
    references: [users.id],
  }),
}));

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Benefit monitoring relations
export const benefitMonitoringRelations = relations(benefitMonitoring, ({ one }) => ({
  user: one(users, {
    fields: [benefitMonitoring.userId],
    references: [users.id],
  }),
}));

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional(),
  role: z.enum(["administrator", "gerente", "vendedor"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export const createUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["administrator", "gerente", "vendedor"]).optional(),
  isActive: z.boolean().optional(),
});

// New schemas for dashboard and CRM features
export const createConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

export const createFavoriteClientSchema = createInsertSchema(favoriteClients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFavoriteClientSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  status: z.enum(["contactado", "negociacao", "finalizado"]).optional(),
});

export const createNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const createBenefitMonitoringSchema = createInsertSchema(benefitMonitoring).omit({
  id: true,
  createdAt: true,
  lastCheck: true,
});

export const dashboardStatsSchema = z.object({
  totalConsultations: z.number(),
  consultationsToday: z.number(),
  consultationsThisWeek: z.number(),
  consultationsThisMonth: z.number(),
  consultationsByCpf: z.number(),
  consultationsByBenefit: z.number(),
  favoriteClients: z.number(),
  unreadNotifications: z.number(),
  topUsers: z.array(z.object({
    userId: z.string(),
    username: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    consultationCount: z.number(),
  })),
  marginDistribution: z.array(z.object({
    range: z.string(),
    count: z.number(),
  })),
  blockedLoansCount: z.number(),
  unblockedLoansCount: z.number(),
  averageMargin: z.number(),
});

export const dashboardFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Consultation = typeof consultations.$inferSelect;
export type CreateConsultation = z.infer<typeof createConsultationSchema>;

export type FavoriteClient = typeof favoriteClients.$inferSelect;
export type CreateFavoriteClient = z.infer<typeof createFavoriteClientSchema>;
export type UpdateFavoriteClient = z.infer<typeof updateFavoriteClientSchema>;

export type Notification = typeof notifications.$inferSelect;
export type CreateNotification = z.infer<typeof createNotificationSchema>;

export type BenefitMonitoring = typeof benefitMonitoring.$inferSelect;
export type CreateBenefitMonitoring = z.infer<typeof createBenefitMonitoringSchema>;

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

export type Beneficiary = z.infer<typeof beneficiarySchema>;
export type FinancialSummary = z.infer<typeof financialSummarySchema>;
export type BankingData = z.infer<typeof bankingDataSchema>;
export type Loan = z.infer<typeof loanSchema>;
export type Benefit = z.infer<typeof benefitSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
