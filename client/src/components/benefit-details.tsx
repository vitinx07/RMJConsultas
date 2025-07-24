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
import { formatCurrency, formatDate, formatDateWithAge, formatCPF, formatBankAccount, getBenefitSpeciesName, getBankName, getBankCodeFromName } from "@/lib/utils";
import { BankIcon } from "@/components/bank-icon";
import { BanrisulSimulation } from "@/components/banrisul-simulation";

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
    Associacao,
    DadosRepresentante 
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
          ${DadosRepresentante && DadosRepresentante.length > 0 ? `
          <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 5px;">
            <h3 style="color: #856404; margin: 0 0 5px 0;">⚠️ ATENÇÃO: BENEFICIÁRIO COM REPRESENTANTE LEGAL</h3>
            <p style="color: #856404; margin: 0;">Este beneficiário possui representante legal responsável por suas decisões financeiras.</p>
          </div>
          ` : ''}
        </div>

        ${DadosRepresentante && DadosRepresentante.length > 0 ? `
        <div class="section">
          <h3>Dados do Representante Legal</h3>
          ${DadosRepresentante.map(rep => `
          <div class="personal-info">
            <div class="info-item"><strong>Nome:</strong> ${rep.Nome}</div>
            <div class="info-item"><strong>CPF:</strong> ${formatCPF(rep.CPF)}</div>
            <div class="info-item"><strong>Parentesco:</strong> ${rep.Parentesco}</div>
            ${rep.Telefone ? `<div class="info-item"><strong>Telefone:</strong> ${rep.Telefone}</div>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <h3>Dados Pessoais</h3>
          <div class="personal-info">
            <div class="info-item"><strong>Nome:</strong> ${Beneficiario.Nome}</div>
            <div class="info-item"><strong>CPF:</strong> ${formatCPF(Beneficiario.CPF)}</div>
            <div class="info-item"><strong>Data de Nascimento:</strong> ${formatDateWithAge(Beneficiario.DataNascimento)}</div>
            <div class="info-item"><strong>Sexo:</strong> ${Beneficiario.Sexo === 'M' ? 'Masculino' : Beneficiario.Sexo === 'F' ? 'Feminino' : Beneficiario.Sexo || 'N/A'}</div>
            <div class="info-item"><strong>RG:</strong> ${Beneficiario.Rg || 'N/A'}</div>
            <div class="info-item"><strong>DIB:</strong> ${formatDate(Beneficiario.DIB)}</div>
            <div class="info-item"><strong>Nome da Mãe:</strong> ${Beneficiario.NomeMae}</div>
            <div class="info-item"><strong>Endereço:</strong> ${Beneficiario.Endereco}, ${Beneficiario.Bairro}</div>
            <div class="info-item"><strong>Cidade/UF:</strong> ${Beneficiario.Cidade} - ${Beneficiario.UF}</div>
            <div class="info-item"><strong>CEP:</strong> ${Beneficiario.CEP}</div>
            <div class="info-item"><strong>Situação:</strong> ${Beneficiario.Situacao}</div>
            <div class="info-item"><strong>Bloqueado para Empréstimo:</strong> ${Beneficiario.BloqueadoEmprestimo === 'SIM' ? 'SIM' : 'NÃO'}</div>
            <div class="info-item"><strong>Espécie:</strong> ${Beneficiario.Especie} - ${getBenefitSpeciesName(Beneficiario.Especie)}</div>
          </div>
        </div>

        <div class="section">
          <h3>Dados Bancários e Meio de Recebimento</h3>
          <div class="personal-info">
            <div class="info-item"><strong>Banco:</strong> ${DadosBancarios.Banco}</div>
            <div class="info-item"><strong>Agência:</strong> ${DadosBancarios.Agencia}</div>
            ${DadosBancarios.MeioPagamento === '3' ? `
              <div class="info-item" style="background: #e3f2fd;"><strong>Meio de Recebimento:</strong> CARTÃO MAGNÉTICO</div>
              <div class="info-item" style="background: #fff3e0;"><strong>Observação:</strong> Beneficiário NÃO possui conta bancária - recebe via cartão magnético</div>
            ` : `
              <div class="info-item"><strong>Conta:</strong> ${DadosBancarios.ContaPagto}</div>
              <div class="info-item"><strong>Meio de Recebimento:</strong> ${DadosBancarios.MeioPagamento === '1' ? 'Conta Corrente' : 'Conta Poupança'}</div>
            `}
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
                <th>Saldo Devedor</th>
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
                  <td>${emprestimo.NomeBanco || 'N/A'}</td>
                  <td>${emprestimo.Contrato || 'N/A'}</td>
                  <td>${formatCurrency(emprestimo.ValorParcela)}</td>
                  <td style="color: #dc2626; font-weight: bold;">${formatCurrency(emprestimo.Quitacao)}</td>
                  <td>${formatCurrency(emprestimo.ValorEmprestimo)}</td>
                  <td>${emprestimo.Prazo || 'N/A'}</td>
                  <td>${emprestimo.ParcelasRestantes || 'N/A'}</td>
                  <td>${emprestimo.DataAverbacao ? formatDate(emprestimo.DataAverbacao) : 'N/A'}</td>
                  <td>${emprestimo.Taxa ? emprestimo.Taxa.toFixed(2) : '0.00'}%</td>
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
          <h3>RCC - Reserva de Margem Consignável (Benefício) </h3>
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
      {/* Legal Representative Warning */}
      {DadosRepresentante && DadosRepresentante.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <UserX className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-bold text-orange-800">ATENÇÃO: BENEFICIÁRIO COM REPRESENTANTE LEGAL</h3>
                <p className="text-orange-700">Este beneficiário possui representante legal responsável por suas decisões financeiras.</p>
              </div>
            </div>
            {DadosRepresentante.map((representante, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">Dados do Representante Legal:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <p className="font-semibold">{representante.Nome}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">CPF:</span>
                    <p className="font-semibold">{formatCPF(representante.CPF)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Parentesco:</span>
                    <p className="font-semibold">{representante.Parentesco}</p>
                  </div>
                  {representante.Telefone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      <p className="font-semibold">{representante.Telefone}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Detalhes do Benefício {Beneficiario.Beneficio}
            {DadosRepresentante && DadosRepresentante.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                Com Representante Legal
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <Accordion type="multiple" className="w-full">
          {/* Beneficiary Data */}
          <AccordionItem value="beneficiary" className="border-b">
            <AccordionTrigger className="px-4 py-4 hover:bg-muted/30">
              <span className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                Dados do Beneficiário
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold text-foreground">{Beneficiario.Nome}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-semibold text-foreground">{formatCPF(Beneficiario.CPF)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-semibold">{formatDateWithAge(Beneficiario.DataNascimento)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sexo</p>
                    <p className="font-semibold">{Beneficiario.Sexo === 'M' ? 'Masculino' : Beneficiario.Sexo === 'F' ? 'Feminino' : Beneficiario.Sexo || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">RG</p>
                    <p className="font-semibold">{Beneficiario.Rg || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">DIB (Data de Início do Benefício)</p>
                    <p className="font-semibold">{formatDate(Beneficiario.DIB)}</p>
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
                    <p className="text-sm text-muted-foreground">CEP</p>
                    <p className="font-semibold">{Beneficiario.CEP || 'N/A'}</p>
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
                    <p className="font-semibold">{Beneficiario.Cidade}  {Beneficiario.UF}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">UF do Benefício</p>
                    <p className="font-semibold">{Beneficiario.UFBeneficio || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Espécie</p>
                    <p className="font-semibold">{Beneficiario.Especie || 'N/A'}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {getBenefitSpeciesName(Beneficiario.Especie)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Info className={`h-5 w-5 ${Beneficiario.Situacao === 'Ativo' ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Situação do Benefício</p>
                    <p className={`font-semibold ${Beneficiario.Situacao === 'Ativo' ? 'text-green-600' : 'text-red-600'}`}>
                      {Beneficiario.Situacao || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Info className={`h-5 w-5 ${Beneficiario.BloqueadoEmprestimo === '1' ? 'text-red-600' : 'text-green-600'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Bloqueado para Empréstimo</p>
                    <p className={`font-semibold ${Beneficiario.BloqueadoEmprestimo === '1' ? 'text-red-600' : 'text-green-600'}`}>
                      {Beneficiario.BloqueadoEmprestimo === '1' ? 'SIM - BLOQUEADO' : 'NÃO - DESBLOQUEADO'}
                    </p>
                  </div>
                </div>
                
                {/* Representante Legal e Procuração */}
                <div className="flex items-center gap-3">
                  <UserX className={`h-5 w-5 ${Beneficiario.RL === '1' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Representante Legal</p>
                    <p className={`font-semibold ${Beneficiario.RL === '1' ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {Beneficiario.RL === '1' ? 'POSSUI' : 'NÃO POSSUI'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 ${Beneficiario.PA === '1' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Procuração</p>
                    <p className={`font-semibold ${Beneficiario.PA === '1' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {Beneficiario.PA === '1' ? 'POSSUI' : 'NÃO POSSUI'}
                    </p>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t my-6"></div>

                {/* Outras Informações integradas */}
                <div className="space-y-6">
                  <h4 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    <Info className="h-5 w-5" />
                    Outras Informações
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Banking Data */}
                    <div className="bg-muted/30 dark:bg-muted/20 border rounded-lg p-4 shadow-sm">
                      <h5 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <University className="h-4 w-4" />
                        Dados Bancários
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Banco:</span>
                          <div className="flex items-center gap-2">
                            <BankIcon bankCode={DadosBancarios.Banco} className="w-5 h-5" />
                            <div className="text-right">
                              <span className="font-medium text-foreground block">
                                {DadosBancarios.Banco} - {getBankName(DadosBancarios.Banco)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Agência:</span>
                          <span className="font-medium text-foreground">{DadosBancarios.Agencia}</span>
                        </div>
                        {DadosBancarios.MeioPagamento === '3' || !DadosBancarios.ContaPagto ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Conta:</span>
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400">
                              Código 02
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Conta:</span>
                            <span className="font-medium text-foreground">{DadosBancarios.ContaPagto}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Information */}
                    <div className="bg-muted/30 dark:bg-muted/20 border rounded-lg p-4 shadow-sm">
                      <h5 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <CreditCard className="h-4 w-4" />
                        Informações do Cartão
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Possui Cartão:</span>
                          <Badge variant={ResumoFinanceiro.PossuiCartao ? "default" : "secondary"}>
                            {ResumoFinanceiro.PossuiCartao ? "SIM" : "NÃO"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Meio de Recebimento:</span>
                          <Badge variant={DadosBancarios.MeioPagamento === '3' ? "default" : "secondary"} 
                                 className={DadosBancarios.MeioPagamento === '3' ? "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400" : ""}>
                            {DadosBancarios.MeioPagamento === '1' ? 'Conta Corrente' : 
                             DadosBancarios.MeioPagamento === '2' ? 'Conta Poupança' : 
                             DadosBancarios.MeioPagamento === '3' ? 'Cartão Magnético' : 
                             `Código: ${DadosBancarios.MeioPagamento}`}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Possui Conta Bancária:</span>
                          <Badge variant={DadosBancarios.MeioPagamento === '3' ? "destructive" : "default"}>
                            {DadosBancarios.MeioPagamento === '3' ? 'NÃO - Só Cartão' : 'SIM - Tem Conta'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Desconto Associação:</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(ResumoFinanceiro.DescontoAssociacao)}
                          </span>
                        </div>
                        {typeof Associacao === 'object' && 'TaxaAssociativa' in Associacao && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Taxa Associativa:</span>
                            <span className="font-medium text-foreground">
                              {Associacao.TaxaAssociativa} - {formatCurrency(Associacao.Parcela)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Financial Summary */}
          <AccordionItem value="financial" className="border-b">
            <AccordionTrigger className="px-4 py-4 hover:bg-muted/30">
              <span className="flex items-center gap-2 font-medium">
                <DollarSign className="h-4 w-4" />
                Resumo Financeiro e Margens
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-muted/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Values */}
                <div className="space-y-4">
                  <div className="bg-card border rounded-lg p-4 shadow-sm">
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
                  <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Base de Cálculo</p>
                        <p className="text-xl font-semibold text-foreground">
                          {formatCurrency(ResumoFinanceiro.BaseCalculo)}
                        </p>
                      </div>
                      <Calculator className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Margem Empréstimo</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(ResumoFinanceiro.MargemDisponivelEmprestimo)}
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-green-600 dark:bg-green-700 rounded-full flex items-center justify-center">
                        <PiggyBank className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`border rounded-lg p-3 shadow-sm ${
                      ResumoFinanceiro.MargemDisponivelRmc < 0 ? 
                      'bg-red-50 dark:bg-red-950/20 border-red-200' : 
                      'bg-card'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Margem RMC</p>
                        {ResumoFinanceiro.MargemDisponivelRmc < 0 && (
                          <Badge variant="destructive" className="text-xs">NEGATIVA</Badge>
                        )}
                      </div>
                      <p className={`text-lg font-semibold ${
                        ResumoFinanceiro.MargemDisponivelRmc < 0 ? 
                        'text-red-600 dark:text-red-400' : 
                        'text-foreground'
                      }`}>
                        {formatCurrency(ResumoFinanceiro.MargemDisponivelRmc)}
                      </p>
                      {ResumoFinanceiro.MargemDisponivelRmc < 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Cliente com cartão em débito
                        </p>
                      )}
                    </div>
                    <div className={`border rounded-lg p-3 shadow-sm ${
                      ResumoFinanceiro.MargemDisponivelRcc < 0 ? 
                      'bg-red-50 dark:bg-red-950/20 border-red-200' : 
                      'bg-card'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Margem RCC</p>
                        {ResumoFinanceiro.MargemDisponivelRcc < 0 && (
                          <Badge variant="destructive" className="text-xs">NEGATIVA</Badge>
                        )}
                      </div>
                      <p className={`text-lg font-semibold ${
                        ResumoFinanceiro.MargemDisponivelRcc < 0 ? 
                        'text-red-600 dark:text-red-400' : 
                        'text-foreground'
                      }`}>
                        {formatCurrency(ResumoFinanceiro.MargemDisponivelRcc)}
                      </p>
                      {ResumoFinanceiro.MargemDisponivelRcc < 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Cliente com cartão em débito
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Loan Contracts */}
          <AccordionItem value="loans" className="border-b">
            <AccordionTrigger className="px-4 py-4 hover:bg-muted/30">
              <span className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                Contratos de Empréstimo Ativos ({Emprestimos.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-muted/20">
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
                  <div className="overflow-x-auto border rounded-lg">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b">
                          <TableHead className="font-semibold text-foreground min-w-[180px] h-12">Banco</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[180px] h-12">Contrato</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[120px] h-12">Valor Parcela</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[120px] h-12">Saldo Devedor</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[80px] h-12">Prazo</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[100px] h-12">Parcelas Rest.</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[100px] h-12">Parcelas Pagas</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[100px] h-12">Taxa (%)</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[120px] h-12">Averbação</TableHead>
                          <TableHead className="font-semibold text-foreground min-w-[120px] h-12">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Emprestimos.map((emprestimo, index) => (
                          <TableRow key={index} className="hover:bg-muted/30 border-b">
                            <TableCell className="font-medium text-foreground bg-background">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const originalBankCode = emprestimo.Banco || emprestimo.CodigoBanco || '';
                                  const bankNameFromAPI = emprestimo.NomeBanco || '';
                                  
                                  // Se tem código de banco, usa o mapeamento
                                  if (originalBankCode) {
                                    const normalizedCode = originalBankCode.padStart(3, '0');
                                    const bankName = getBankName(normalizedCode);
                                    const displayCode = originalBankCode;
                                    
                                    return (
                                      <>
                                        <BankIcon bankCode={normalizedCode} className="w-4 h-4" />
                                        <div className="max-w-[160px] break-words" title={`${displayCode} - ${bankName}`}>
                                          {bankName !== 'Banco ' + normalizedCode ? `${displayCode} - ${bankName}` : bankNameFromAPI || 'N/A'}
                                        </div>
                                      </>
                                    );
                                  }
                                  
                                  // Se não tem código, tenta buscar código pelo nome
                                  if (bankNameFromAPI) {
                                    const mappedCode = getBankCodeFromName(bankNameFromAPI);
                                    if (mappedCode !== '000') {
                                      const bankName = getBankName(mappedCode);
                                      return (
                                        <>
                                          <BankIcon bankCode={mappedCode} className="w-4 h-4" />
                                          <div className="max-w-[160px] break-words" title={`${mappedCode} - ${bankName}`}>
                                            {mappedCode} - {bankName}
                                          </div>
                                        </>
                                      );
                                    }
                                  }
                                  
                                  // Fallback para nome da API apenas
                                  return (
                                    <>
                                      <BankIcon bankCode="000" className="w-4 h-4" />
                                      <div className="max-w-[160px] break-words" title={bankNameFromAPI}>
                                        {bankNameFromAPI || 'N/A'}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-foreground bg-background">
                              <div className="break-all min-w-[160px]" title={emprestimo.Contrato}>
                                {emprestimo.Contrato || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600 bg-background">
                              {formatCurrency(emprestimo.ValorParcela)}
                            </TableCell>
                            <TableCell className="font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400">
                              {formatCurrency(emprestimo.Quitacao)}
                            </TableCell>
                            <TableCell className="text-center text-foreground bg-background">
                              {emprestimo.Prazo || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center font-medium text-foreground bg-background">
                              {emprestimo.ParcelasRestantes || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center font-medium text-blue-600 bg-background">
                              {emprestimo.Prazo && emprestimo.ParcelasRestantes ? 
                                (parseInt(emprestimo.Prazo) - parseInt(emprestimo.ParcelasRestantes)) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-orange-600 bg-background">
                              {emprestimo.Taxa ? `${emprestimo.Taxa.toFixed(2)}%` : '0.00%'}
                            </TableCell>
                            <TableCell className="text-sm text-foreground bg-background">
                              {emprestimo.DataAverbacao ? formatDate(emprestimo.DataAverbacao) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center bg-background">
                              {(() => {
                                // Verificar se é banco Banrisul (código 041)
                                const originalBankCode = emprestimo.Banco || emprestimo.CodigoBanco || '';
                                const bankNameFromAPI = emprestimo.NomeBanco || '';
                                
                                // Verificar por código
                                if (originalBankCode === '041' || originalBankCode === '41') {
                                  return (
                                    <BanrisulSimulation
                                      cpf={Beneficiario.CPF}
                                      dataNascimento={Beneficiario.DataNascimento}
                                      contrato={emprestimo.Contrato || ''}
                                      dataContrato={emprestimo.DataAverbacao || new Date().toISOString()}
                                      valorParcela={emprestimo.ValorParcela}
                                      conveniada="000020"
                                      className="w-full"
                                    />
                                  );
                                }
                                
                                // Verificar por nome
                                if (bankNameFromAPI && (
                                  bankNameFromAPI.toLowerCase().includes('banrisul') || 
                                  bankNameFromAPI.toLowerCase().includes('rio grande do sul')
                                )) {
                                  return (
                                    <BanrisulSimulation
                                      cpf={Beneficiario.CPF}
                                      dataNascimento={Beneficiario.DataNascimento}
                                      contrato={emprestimo.Contrato || ''}
                                      dataContrato={emprestimo.DataAverbacao || new Date().toISOString()}
                                      valorParcela={emprestimo.ValorParcela}
                                      conveniada="000020"
                                      className="w-full"
                                    />
                                  );
                                }
                                
                                return <span className="text-muted-foreground text-xs">N/A</span>;
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-white dark:bg-card rounded-lg p-4 border">
                    <h4 className="font-semibold mb-3 text-foreground">Resumo dos Contratos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{Emprestimos.length}</div>
                        <div className="text-sm text-muted-foreground">Contratos Ativos</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(ResumoFinanceiro.TotalParcelas)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Parcelas</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(Emprestimos.reduce((sum, emp) => sum + emp.Quitacao, 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Saldo Total Devedor</div>
                      </div>
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
              <AccordionTrigger className="px-4 py-4 hover:bg-muted/30">
                <span className="flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4" />
                  RMC - Cartão de Crédito Consignado
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-muted/20">
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <University className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Banco</p>
                        <p className="font-semibold text-foreground">{Rmc.Banco} - {Rmc.NomeBanco}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contrato</p>
                        <p className="font-semibold text-foreground">{Rmc.Contrato}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Empréstimo</p>
                        <p className="font-semibold text-foreground">{formatCurrency(Rmc.Valor_emprestimo)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Parcela</p>
                        <p className="font-semibold text-foreground">{formatCurrency(Rmc.ValorParcela)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Inclusão</p>
                        <p className="font-semibold text-foreground">{formatDate(Rmc.Data_inclusao)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold text-foreground">{formatCurrency(Rmc.Valor)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* RCC - Reserva de Margem Consignável (Benefício) */}
          {RCC && (
            <AccordionItem value="rcc" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-muted/30">
                <span className="flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4" />
                  RCC - Reserva de Margem Consignável (Benefício)
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-muted/20">
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <University className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Banco</p>
                        <p className="font-semibold text-foreground">{RCC.Banco} {RCC.NomeBanco && `- ${RCC.NomeBanco}`}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contrato</p>
                        <p className="font-semibold text-foreground">{RCC.Contrato}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Empréstimo</p>
                        <p className="font-semibold text-foreground">{formatCurrency(RCC.Valor_emprestimo)}</p>
                      </div>
                    </div>
                    
                    {RCC.ValorParcela && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Parcela</p>
                          <p className="font-semibold text-foreground">{formatCurrency(RCC.ValorParcela)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Inclusão</p>
                        <p className="font-semibold text-foreground">{formatDate(RCC.Data_inclusao)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold text-foreground">{formatCurrency(RCC.Valor)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}


        </Accordion>
      </Card>
    </div>
  );
}
