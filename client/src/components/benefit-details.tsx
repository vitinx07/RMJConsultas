import { useState } from "react";
import { 
  User, 
  DollarSign, 
  FileText, 
  Info, 
  University, 
  CreditCard,
  Calendar,
  MapPin,
  UserX,
  PiggyBank,
  Calculator
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Benefit } from "@shared/schema";
import { formatCurrency, formatDate, formatCPF, formatBankAccount } from "@/lib/utils";

interface BenefitDetailsProps {
  benefit: Benefit;
}

export function BenefitDetails({ benefit }: BenefitDetailsProps) {
  const { 
    Beneficiario, 
    ResumoFinanceiro, 
    DadosBancarios, 
    Emprestimos, 
    Rmc,
    Associacao 
  } = benefit;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Detalhes do Benefício {Beneficiario.Beneficio}
          </CardTitle>
        </CardHeader>

        <Accordion type="single" collapsible className="w-full">
          {/* Beneficiary Data */}
          <AccordionItem value="beneficiary" className="border-b">
            <AccordionTrigger className="px-4 py-4 hover:bg-gray-50">
              <span className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                Dados do Beneficiário
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{Beneficiario.Nome}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-semibold">{formatCPF(Beneficiario.CPF)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-semibold">{formatDate(Beneficiario.DataNascimento)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome da Mãe</p>
                    <p className="font-semibold">{Beneficiario.NomeMae}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-semibold">{Beneficiario.Endereco}, {Beneficiario.Bairro}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade/UF</p>
                    <p className="font-semibold">{Beneficiario.Cidade} - {Beneficiario.UF}</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Financial Summary */}
          <AccordionItem value="financial" className="border-b">
            <AccordionTrigger className="px-4 py-4 hover:bg-gray-50">
              <span className="flex items-center gap-2 font-medium">
                <DollarSign className="h-4 w-4" />
                Resumo Financeiro e Margens
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Values */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor do Benefício</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(ResumoFinanceiro.ValorBeneficio)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Base de Cálculo</p>
                        <p className="text-xl font-semibold">
                          {formatCurrency(ResumoFinanceiro.BaseCalculo)}
                        </p>
                      </div>
                      <Calculator className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Margem Empréstimo</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(ResumoFinanceiro.MargemDisponivelEmprestimo)}
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                        <PiggyBank className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">Margem RMC</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(ResumoFinanceiro.MargemDisponivelRmc)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">Margem RCC</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(ResumoFinanceiro.MargemDisponivelRcc)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Loan Contracts */}
          <AccordionItem value="loans" className="border-b">
            <AccordionTrigger className="px-4 py-4 hover:bg-gray-50">
              <span className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                Contratos de Empréstimo Ativos ({Emprestimos.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-gray-50">
              {Emprestimos.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Banco</TableHead>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Valor Parcela</TableHead>
                          <TableHead>Prazo</TableHead>
                          <TableHead>Parcelas Rest.</TableHead>
                          <TableHead>Averbação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Emprestimos.map((emprestimo, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {emprestimo.NomeBanco}
                            </TableCell>
                            <TableCell>{emprestimo.Contrato}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(emprestimo.ValorParcela)}
                            </TableCell>
                            <TableCell>{emprestimo.Prazo}</TableCell>
                            <TableCell>{emprestimo.ParcelasRestantes}</TableCell>
                            <TableCell>{formatDate(emprestimo.DataAverbacao)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total de Empréstimos:</span>
                      <span className="font-bold">{Emprestimos.length} contratos</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Total de Parcelas:</span>
                      <span className="font-bold">
                        {formatCurrency(ResumoFinanceiro.TotalParcelas)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum contrato de empréstimo ativo encontrado.
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Other Information */}
          <AccordionItem value="other">
            <AccordionTrigger className="px-4 py-4 hover:bg-gray-50">
              <span className="flex items-center gap-2 font-medium">
                <Info className="h-4 w-4" />
                Outras Informações
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banking Data */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <University className="h-4 w-4" />
                    Dados Bancários
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banco:</span>
                      <span className="font-medium">{DadosBancarios.Banco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agência:</span>
                      <span className="font-medium">{DadosBancarios.Agencia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conta:</span>
                      <span className="font-medium">{DadosBancarios.ContaPagto}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Services */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Serviços Adicionais
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Possui Cartão:</span>
                      <Badge variant={ResumoFinanceiro.PossuiCartao ? "default" : "secondary"}>
                        {ResumoFinanceiro.PossuiCartao ? "Sim" : "Não"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Desconto Associação:</span>
                      <span className="font-medium">
                        {formatCurrency(ResumoFinanceiro.DescontoAssociacao)}
                      </span>
                    </div>
                    {typeof Associacao === 'object' && 'TaxaAssociativa' in Associacao && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Taxa Associativa:</span>
                        <span className="font-medium">
                          {Associacao.TaxaAssociativa} - {formatCurrency(Associacao.Parcela)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
