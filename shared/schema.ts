import { z } from "zod";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  uuid,
  index,
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

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  createdUsers: many(users, { relationName: "creator" }),
  creator: one(users, {
    fields: [users.createdBy],
    references: [users.id],
    relationName: "creator",
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

// Types
export type User = typeof users.$inferSelect;
export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Beneficiary = z.infer<typeof beneficiarySchema>;
export type FinancialSummary = z.infer<typeof financialSummarySchema>;
export type BankingData = z.infer<typeof bankingDataSchema>;
export type Loan = z.infer<typeof loanSchema>;
export type Benefit = z.infer<typeof benefitSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
