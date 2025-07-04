import { z } from "zod";

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
  Banco: z.string(),
  NomeBanco: z.string(),
  ValorParcela: z.number(),
  Quitacao: z.number(),
  Prazo: z.string(),
  Tipo: z.string(),
  Taxa: z.number(),
  ParcelasRestantes: z.string(),
  Contrato: z.string(),
  ValorEmprestimo: z.number(),
  ValorLiberado: z.number(),
  DataAverbacao: z.string(),
  InicioDesconto: z.string(),
  FinalDesconto: z.string(),
  CetMensal: z.number().nullable(),
  CetAnual: z.number().nullable(),
  iof: z.number().nullable(),
  taxaAnual: z.number().nullable(),
  taxaMensal: z.number().nullable(),
});

export const benefitSchema = z.object({
  Beneficiario: beneficiarySchema,
  ResumoFinanceiro: financialSummarySchema,
  DadosRepresentante: z.array(z.unknown()),
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

export type Beneficiary = z.infer<typeof beneficiarySchema>;
export type FinancialSummary = z.infer<typeof financialSummarySchema>;
export type BankingData = z.infer<typeof bankingDataSchema>;
export type Loan = z.infer<typeof loanSchema>;
export type Benefit = z.infer<typeof benefitSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
