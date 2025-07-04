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
  Calculator,
  Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    RCC,
    Associacao 
  } = benefit;

  const handlePrintContracts = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Contratos - ${Beneficiario.Nome}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .personal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-item { padding: 5px; background: #f5f5f5; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { background: #e8f5e8; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RMJ CONSULTAS</h1>
          <h2>Relatório de Contratos de Empréstimo</h2>
          <p>Benefício: ${Beneficiario.Beneficio}</p>
          <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="section">
          <h3>Dados Pessoais</h3>
          <div class="personal-info">
            <div class="info-item"><strong>Nome:</strong> ${Beneficiario.Nome}</div>
            <div class="info-item"><strong>CPF:</strong> ${formatCPF(Beneficiario.CPF)}</div>
            <div class="info-item"><strong>Data de Nascimento:</strong> ${formatDate(Beneficiario.DataNascimento)}</div>
            <div class="info-item"><strong>Nome da Mãe:</strong> ${Beneficiario.NomeMae}</div>
            <div class="info-item"><strong>Endereço:</strong> ${Beneficiario.Endereco}, ${Beneficiario.Bairro}</div>
            <div class="info-item"><strong>Cidade/UF:</strong> ${Beneficiario.Cidade} - ${Beneficiario.UF}</div>
            <div class="info-item"><strong>CEP:</strong> ${Beneficiario.CEP}</div>
            <div class="info-item"><strong>Situação:</strong> ${Beneficiario.Situacao}</div>
          </div>
        </div>

        <div class="section">
          <h3>Resumo Financeiro</h3>
          <div class="personal-info">
            <div class="info-item"><strong>Valor do Benefício:</strong> ${formatCurrency(ResumoFinanceiro.ValorBeneficio)}</div>
            <div class="info-item"><strong>Base de Cálculo:</strong> ${formatCurrency(ResumoFinanceiro.BaseCalculo)}</div>
            <div class="info-item"><strong>Margem Disponível:</strong> ${formatCurrency(ResumoFinanceiro.MargemDisponivelEmprestimo)}</div>
            <div class="info-item"><strong>Total de Empréstimos:</strong> ${formatCurrency(ResumoFinanceiro.TotalEmprestimos)}</div>
          </div>
        </div>

        <div class="section">
          <h3>Contratos de Empréstimo Ativos (${Emprestimos.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Banco</th>
                <th>Contrato</th>
                <th>Valor Parcela</th>
                <th>Valor Empréstimo</th>
                <th>Prazo</th>
                <th>Parcelas Restantes</th>
                <th>Data Averbação</th>
                <th>Taxa (%)</th>
              </tr>
            </thead>
            <tbody>
              ${Emprestimos.map(emprestimo => `
                <tr>
                  <td>${emprestimo.NomeBanco}</td>
                  <td>${emprestimo.Contrato}</td>
                  <td>${formatCurrency(emprestimo.ValorParcela)}</td>
                  <td>${formatCurrency(emprestimo.ValorEmprestimo)}</td>
                  <td>${emprestimo.Prazo}</td>
                  <td>${emprestimo.ParcelasRestantes}</td>
                  <td>${formatDate(emprestimo.DataAverbacao)}</td>
                  <td>${emprestimo.Taxa.toFixed(2)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${Rmc ? `
        <div class="section">
          <h3>RMC - Cartão de Crédito Consignado</h3>
          <div class="personal-info">
            <div class="info-item"><strong>Banco:</strong> ${Rmc.Banco} - ${Rmc.NomeBanco}</div>
            <div class="info-item"><strong>Contrato:</strong> ${Rmc.Contrato}</div>
            <div class="info-item"><strong>Valor Empréstimo:</strong> ${formatCurrency(Rmc.Valor_emprestimo)}</div>
            <div class="info-item"><strong>Valor Parcela:</strong> ${formatCurrency(Rmc.ValorParcela)}</div>
            <div class="info-item"><strong>Data de Inclusão:</strong> ${formatDate(Rmc.Data_inclusao)}</div>
            <div class="info-item"><strong>Valor Atual:</strong> ${formatCurrency(Rmc.Valor)}</div>
          </div>
        </div>
        ` : ''}

        ${RCC ? `
        <div class="section">
          <h3>RCC - Reserva de Margem Consignável</h3>
          <div class="personal-info">
            <div class="info-item"><strong>Banco:</strong> ${RCC.Banco} ${RCC.NomeBanco ? `- ${RCC.NomeBanco}` : ''}</div>
            <div class="info-item"><strong>Contrato:</strong> ${RCC.Contrato}</div>
            <div class="info-item"><strong>Valor Empréstimo:</strong> ${formatCurrency(RCC.Valor_emprestimo)}</div>
            ${RCC.ValorParcela ? `<div class="info-item"><strong>Valor Parcela:</strong> ${formatCurrency(RCC.ValorParcela)}</div>` : ''}
            <div class="info-item"><strong>Data de Inclusão:</strong> ${formatDate(RCC.Data_inclusao)}</div>
            <div class="info-item"><strong>Valor Atual:</strong> ${formatCurrency(RCC.Valor)}</div>
          </div>
        </div>
        ` : ''}

        <div class="summary">
          <h3>Resumo dos Contratos</h3>
          <p><strong>Total de Contratos:</strong> ${Emprestimos.length}</p>
          <p><strong>Total de Parcelas:</strong> ${formatCurrency(ResumoFinanceiro.TotalParcelas)}</p>
          <p><strong>Total de Contratos:</strong> ${formatCurrency(ResumoFinanceiro.TotalContrato)}</p>
          ${Rmc ? `<p><strong>RMC Ativo:</strong> Sim</p>` : ''}
          ${RCC ? `<p><strong>RCC Ativo:</strong> Sim</p>` : ''}
        </div>

        <div class="footer">
          <p>© 2024 RMJ Consultas - Sistema de Consulta de Benefícios INSS</p>
          <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Detalhes do Benefício {Beneficiario.Beneficio}
          </CardTitle>
        </CardHeader>

        <Accordion type="multiple" className="w-full">
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
              {Emprestimos.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <Button onClick={handlePrintContracts} variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir Relatório
                  </Button>
                </div>
              )}
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

          {/* RMC - Cartão de Crédito Consignado */}
          {Rmc && (
            <AccordionItem value="rmc" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50">
                <span className="flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4" />
                  RMC - Cartão de Crédito Consignado
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-gray-50">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <University className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Banco</p>
                        <p className="font-semibold">{Rmc.Banco} - {Rmc.NomeBanco}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contrato</p>
                        <p className="font-semibold">{Rmc.Contrato}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Empréstimo</p>
                        <p className="font-semibold">{formatCurrency(Rmc.Valor_emprestimo)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Parcela</p>
                        <p className="font-semibold">{formatCurrency(Rmc.ValorParcela)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Inclusão</p>
                        <p className="font-semibold">{formatDate(Rmc.Data_inclusao)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold">{formatCurrency(Rmc.Valor)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* RCC - Reserva de Margem Consignável */}
          {RCC && (
            <AccordionItem value="rcc" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50">
                <span className="flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4" />
                  RCC - Reserva de Margem Consignável
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-gray-50">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <University className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Banco</p>
                        <p className="font-semibold">{RCC.Banco} {RCC.NomeBanco && `- ${RCC.NomeBanco}`}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contrato</p>
                        <p className="font-semibold">{RCC.Contrato}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Empréstimo</p>
                        <p className="font-semibold">{formatCurrency(RCC.Valor_emprestimo)}</p>
                      </div>
                    </div>
                    
                    {RCC.ValorParcela && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Parcela</p>
                          <p className="font-semibold">{formatCurrency(RCC.ValorParcela)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Inclusão</p>
                        <p className="font-semibold">{formatDate(RCC.Data_inclusao)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold">{formatCurrency(RCC.Valor)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

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
