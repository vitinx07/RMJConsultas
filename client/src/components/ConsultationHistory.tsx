import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { Search, Eye, FileText, Calendar, User, AlertTriangle, DollarSign, CreditCard, Building2, Phone, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// import { BankIcon } from "@/components/BankIcon";

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatação de CPF
const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  const padded = cleaned.padStart(11, '0');
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Componente para exibir detalhes completos da consulta
function ConsultationDetails({ consultation, onExportPDF }: { consultation: any, onExportPDF: (consultation: any, benefit: any) => void }) {
  const [selectedBenefitIndex, setSelectedBenefitIndex] = useState<number>(0);
  
  const resultData = consultation.resultData;
  const benefits = Array.isArray(resultData) ? resultData : [resultData];
  const currentBenefit = benefits[selectedBenefitIndex];

  if (!currentBenefit) {
    return <div className="text-center py-8">Dados da consulta não encontrados</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Benefício se houver múltiplos */}
      {benefits.length > 1 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Selecionar Benefício:</label>
          <Select value={selectedBenefitIndex.toString()} onValueChange={(value) => setSelectedBenefitIndex(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {benefits.map((benefit: any, index: number) => (
                <SelectItem key={index} value={index.toString()}>
                  {benefit.Beneficiario?.Beneficio} - {benefit.Beneficiario?.Nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Botão de Exportar PDF */}
      <div className="flex justify-end">
        <Button onClick={() => onExportPDF(consultation, currentBenefit)} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF Completo
        </Button>
      </div>

      {/* Detalhes do Beneficiário */}
      <Accordion type="multiple" defaultValue={["beneficiario", "financeiro"]} className="w-full">
        <AccordionItem value="beneficiario">
          <AccordionTrigger className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados do Beneficiário
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Nome || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CPF</label>
                <p className="text-sm font-mono">{consultation.cpf || formatCPF(consultation.searchValue)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.DataNascimento || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">RG</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Rg || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sexo</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Sexo || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome da Mãe</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.NomeMae || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CEP</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Cep || currentBenefit.Beneficiario?.CEP || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">DIB (Data Início Benefício)</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.DIB || 'N/A'}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="beneficio">
          <AccordionTrigger className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dados do Benefício
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número do Benefício</label>
                <p className="text-sm font-mono">{currentBenefit.Beneficiario?.Beneficio || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Espécie</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Especie || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Situação</label>
                <Badge variant={currentBenefit.Beneficiario?.Situacao === 'ATIVO' ? 'default' : 'secondary'}>
                  {currentBenefit.Beneficiario?.Situacao || 'N/A'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">DIB (Data Início)</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.DIB || 'N/A'}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="financeiro">
          <AccordionTrigger className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Informações Financeiras
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor do Benefício</label>
                <p className="text-sm font-semibold text-green-600">
                  {currentBenefit.ResumoFinanceiro ? formatCurrency(currentBenefit.ResumoFinanceiro.ValorBeneficio) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Margem Disponível Empréstimo</label>
                <p className="text-sm font-semibold text-blue-600">
                  {currentBenefit.ResumoFinanceiro ? formatCurrency(currentBenefit.ResumoFinanceiro.MargemDisponivelEmprestimo) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Margem Disponível RMC</label>
                <p className="text-sm">{currentBenefit.ResumoFinanceiro ? formatCurrency(currentBenefit.ResumoFinanceiro.MargemDisponivelRmc) : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Margem Disponível RCC</label>
                <p className="text-sm">{currentBenefit.ResumoFinanceiro ? formatCurrency(currentBenefit.ResumoFinanceiro.MargemDisponivelRcc) : 'N/A'}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="emprestimos">
          <AccordionTrigger className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Contratos de Empréstimo
          </AccordionTrigger>
          <AccordionContent>
            {currentBenefit.ContratosEmprestimo && currentBenefit.ContratosEmprestimo.length > 0 ? (
              <div className="space-y-4">
                {currentBenefit.ContratosEmprestimo.map((contrato: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">{contrato.NomeBanco}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Contrato: {contrato.NumeroContrato || contrato.Contrato}</div>
                      <div>Valor: {formatCurrency(contrato.ValorEmprestimo || contrato.Valor)}</div>
                      <div>Saldo Devedor: {formatCurrency(contrato.SaldoDevedor)}</div>
                      <div>Parcelas: {contrato.ParcelasPagas ? `${contrato.ParcelasPagas}/${contrato.TotalParcelas}` : 
                                     contrato.QuantidadeParcelas ? `- / ${contrato.QuantidadeParcelas}` : 'N/A'}</div>
                      {contrato.TaxaJuros && <div>Taxa Juros: {contrato.TaxaJuros}%</div>}
                      {contrato.ValorParcela && <div>Valor Parcela: {formatCurrency(contrato.ValorParcela)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum contrato de empréstimo encontrado</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cartoes">
          <AccordionTrigger className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Informações de Cartão
          </AccordionTrigger>
          <AccordionContent>
            {currentBenefit.InformacoesCartao && currentBenefit.InformacoesCartao.length > 0 ? (
              <div className="space-y-4">
                {currentBenefit.InformacoesCartao.map((cartao: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">{cartao.NomeBanco}</h4>
                      <Badge variant="outline">{cartao.TipoCartao}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Limite Total: {formatCurrency(cartao.LimiteCartao || cartao.Limite)}</div>
                      <div>Limite Usado: {formatCurrency(cartao.LimiteUsado)}</div>
                      <div>Limite Disponível: {formatCurrency(cartao.LimiteDisponivel || cartao.Disponivel)}</div>
                      {cartao.ValorFatura && <div>Valor Fatura: {formatCurrency(cartao.ValorFatura)}</div>}
                      {cartao.NumeroCartao && <div>Cartão: {cartao.NumeroCartao?.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '**** **** **** $4')}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma informação de cartão encontrada</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contato">
          <AccordionTrigger className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Dados de Contato
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">CEP</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Cep || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Telefone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{currentBenefit.Beneficiario?.Email || 'N/A'}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function ConsultationHistory() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);

  // Query para buscar consultas
  const { data: consultations, isLoading } = useQuery({
    queryKey: ['/api/consultations', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/consultations?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao carregar consultas');
      return response.json();
    }
  });

  // Filtrar consultas baseado na busca
  const filteredConsultations = consultations?.filter((consultation: any) =>
    consultation.beneficiaryName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    consultation.cpf?.includes(searchFilter.replace(/\D/g, '')) ||
    consultation.benefitNumber?.includes(searchFilter)
  ) || [];

  const generatePDF = (consultation: any, benefit: any) => {
    const resultData = consultation.resultData;
    if (!resultData) return;

    // Criar conteúdo do PDF
    const pdfContent = `
=================================================================
                    RELATÓRIO COMPLETO DE CONSULTA INSS
=================================================================

Data da Consulta: ${format(new Date(consultation.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}

DADOS DO BENEFICIÁRIO
=================================================================
Nome: ${benefit.Beneficiario?.Nome || 'N/A'}
CPF: ${consultation.cpf || formatCPF(consultation.searchValue)}
Data de Nascimento: ${benefit.Beneficiario?.DataNascimento || 'N/A'}
RG: ${benefit.Beneficiario?.Rg || 'N/A'}
Sexo: ${benefit.Beneficiario?.Sexo || 'N/A'}
Nome da Mãe: ${benefit.Beneficiario?.NomeMae || 'N/A'}

DADOS DO BENEFÍCIO
=================================================================
Número do Benefício: ${benefit.Beneficiario?.Beneficio || 'N/A'}
Espécie: ${benefit.Beneficiario?.Especie || 'N/A'}
Situação: ${benefit.Beneficiario?.Situacao || 'N/A'}
DIB (Data Início): ${benefit.Beneficiario?.DIB || 'N/A'}
DDB (Data Desligamento): ${benefit.Beneficiario?.DDB || 'N/A'}

INFORMAÇÕES FINANCEIRAS
=================================================================
Valor do Benefício: ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.ValorBeneficio) : 'N/A'}
Base de Cálculo: ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.BaseCalculo) : 'N/A'}
Margem Disponível Empréstimo: ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelEmprestimo) : 'N/A'}
Margem Disponível RMC: ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelRmc) : 'N/A'}
Margem Disponível RCC: ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelRcc) : 'N/A'}
Total Empréstimos: ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.TotalEmprestimos) : 'N/A'}
Possui Cartão: ${benefit.ResumoFinanceiro?.PossuiCartao ? 'SIM' : 'NÃO'}

STATUS DE EMPRÉSTIMO
=================================================================
Bloqueado para Empréstimo: ${benefit.Beneficiario?.BloqueadoEmprestimo === 'SIM' ? 'SIM' : 'NÃO'}
${benefit.Beneficiario?.MotivoBloqueio ? `Motivo do Bloqueio: ${benefit.Beneficiario.MotivoBloqueio}` : ''}

DADOS DE CONTATO E ENDEREÇO
=================================================================
CEP: ${benefit.Beneficiario?.Cep || 'N/A'}
Telefone: ${benefit.Beneficiario?.Telefone || 'N/A'}
Email: ${benefit.Beneficiario?.Email || 'N/A'}

CONTRATOS DE EMPRÉSTIMO ATIVOS
=================================================================
${benefit.ContratosEmprestimo && benefit.ContratosEmprestimo.length > 0 ? 
  benefit.ContratosEmprestimo.map((contrato: any, index: number) => `
Contrato ${index + 1}:
  Número: ${contrato.NumeroContrato}
  Banco: ${contrato.NomeBanco}
  Valor: ${formatCurrency(contrato.ValorEmprestimo)}
  Saldo Devedor: ${formatCurrency(contrato.SaldoDevedor)}
  Parcelas Pagas: ${contrato.ParcelasPagas}/${contrato.TotalParcelas}
  Taxa de Juros: ${contrato.TaxaJuros}%
  `).join('\n') : 'Nenhum contrato de empréstimo encontrado'
}

INFORMAÇÕES DE CARTÃO RMC/RCC
=================================================================
${benefit.InformacoesCartao && benefit.InformacoesCartao.length > 0 ?
  benefit.InformacoesCartao.map((cartao: any, index: number) => `
Cartão ${index + 1}:
  Banco: ${cartao.NomeBanco}
  Tipo: ${cartao.TipoCartao}
  Número: ${cartao.NumeroCartao?.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '**** **** **** $4')}
  Limite: ${formatCurrency(cartao.LimiteCartao)}
  Limite Usado: ${formatCurrency(cartao.LimiteUsado)}
  Limite Disponível: ${formatCurrency(cartao.LimiteDisponivel)}
  `).join('\n') : 'Nenhum cartão encontrado'
}

=================================================================
Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
Sistema MULTI CORBAN - Consulta de Benefícios INSS
=================================================================
    `;

    // Criar HTML para PDF/impressão
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Completo - ${benefit.Beneficiario?.Nome || 'Cliente'}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
          .info-item { padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #007bff; }
          .info-item strong { color: #495057; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .summary { background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RMJ CONSULTAS</h1>
          <h2>Relatório Completo do Cliente</h2>
          <p><strong>Data da Consulta:</strong> ${format(new Date(consultation.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>

        <div class="section">
          <h3>📋 Dados Pessoais</h3>
          <div class="grid">
            <div class="info-item"><strong>Nome:</strong> ${benefit.Beneficiario?.Nome || 'N/A'}</div>
            <div class="info-item"><strong>CPF:</strong> ${formatCPF(benefit.Beneficiario?.CPF || consultation.cpf)}</div>
            <div class="info-item"><strong>Data de Nascimento:</strong> ${benefit.Beneficiario?.DataNascimento || 'N/A'}</div>
            <div class="info-item"><strong>RG:</strong> ${benefit.Beneficiario?.Rg || 'N/A'}</div>
            <div class="info-item"><strong>Sexo:</strong> ${benefit.Beneficiario?.Sexo || 'N/A'}</div>
            <div class="info-item"><strong>CEP:</strong> ${benefit.Beneficiario?.Cep || 'N/A'}</div>
            <div class="info-item"><strong>Nome da Mãe:</strong> ${benefit.Beneficiario?.NomeMae || 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <h3>💳 Dados do Benefício</h3>
          <div class="grid">
            <div class="info-item"><strong>Número do Benefício:</strong> ${benefit.Beneficiario?.Beneficio || 'N/A'}</div>
            <div class="info-item"><strong>Espécie:</strong> ${benefit.Beneficiario?.Especie || 'N/A'}</div>
            <div class="info-item"><strong>Situação:</strong> ${benefit.Beneficiario?.Situacao || 'N/A'}</div>
            <div class="info-item"><strong>DIB (Data Início):</strong> ${benefit.Beneficiario?.DIB || 'N/A'}</div>
            <div class="info-item"><strong>DDB (Data Desligamento):</strong> ${benefit.Beneficiario?.DDB || 'N/A'}</div>
            <div class="info-item"><strong>Valor do Benefício:</strong> ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.ValorBeneficio) : 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <h3>💰 Informações Financeiras</h3>
          <div class="summary">
            <div class="grid">
              <div class="info-item"><strong>Margem Disponível Empréstimo:</strong> ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelEmprestimo) : 'N/A'}</div>
              <div class="info-item"><strong>Margem Disponível RMC:</strong> ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelRmc) : 'N/A'}</div>
              <div class="info-item"><strong>Margem Disponível RCC:</strong> ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelRcc) : 'N/A'}</div>
              <div class="info-item"><strong>Total Empréstimos:</strong> ${benefit.ResumoFinanceiro ? formatCurrency(benefit.ResumoFinanceiro.TotalEmprestimos) : 'N/A'}</div>
              <div class="info-item"><strong>Bloqueado Empréstimo:</strong> ${benefit.Beneficiario?.BloqueadoEmprestimo === 'SIM' ? '❌ SIM' : '✅ NÃO'}</div>
              <div class="info-item"><strong>Possui Cartão:</strong> ${benefit.ResumoFinanceiro?.PossuiCartao ? '✅ SIM' : '❌ NÃO'}</div>
            </div>
          </div>
        </div>

        ${benefit.ContratosEmprestimo && benefit.ContratosEmprestimo.length > 0 ? `
        <div class="section">
          <h3>📋 Contratos de Empréstimo</h3>
          <table>
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Banco</th>
                <th>Valor</th>
                <th>Saldo Devedor</th>
                <th>Parcelas</th>
                <th>Taxa Juros</th>
              </tr>
            </thead>
            <tbody>
              ${benefit.ContratosEmprestimo.map((contrato) => `
              <tr>
                <td>${contrato.NumeroContrato}</td>
                <td>${contrato.NomeBanco}</td>
                <td>${formatCurrency(contrato.ValorEmprestimo)}</td>
                <td>${formatCurrency(contrato.SaldoDevedor)}</td>
                <td>${contrato.ParcelasPagas}/${contrato.TotalParcelas}</td>
                <td>${contrato.TaxaJuros}%</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${benefit.InformacoesCartao && benefit.InformacoesCartao.length > 0 ? `
        <div class="section">
          <h3>💳 Informações de Cartão</h3>
          <table>
            <thead>
              <tr>
                <th>Banco</th>
                <th>Tipo</th>
                <th>Limite</th>
                <th>Disponível</th>
                <th>Fatura</th>
              </tr>
            </thead>
            <tbody>
              ${benefit.InformacoesCartao.map((cartao) => `
              <tr>
                <td>${cartao.Banco}</td>
                <td>${cartao.Tipo}</td>
                <td>${formatCurrency(cartao.Limite)}</td>
                <td>${formatCurrency(cartao.Disponivel)}</td>
                <td>${formatCurrency(cartao.ValorFatura)}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h3>📞 Dados de Contato</h3>
          <div class="grid">
            <div class="info-item"><strong>Telefone:</strong> ${benefit.Beneficiario?.Telefone || 'N/A'}</div>
            <div class="info-item"><strong>Email:</strong> ${benefit.Beneficiario?.Email || 'N/A'}</div>
          </div>
        </div>

        <div class="footer">
          <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')} - RMJ CONSULTAS</p>
          <p>Sistema de Consulta de Benefícios INSS</p>
        </div>
      </body>
      </html>
    `;

    // Abrir em nova janela para imprimir/salvar como PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Aguardar carregamento e configurar para impressão
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Histórico de Consultas
        </CardTitle>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === '7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('7')}
            >
              7 dias
            </Button>
            <Button
              variant={selectedPeriod === '30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('30')}
            >
              30 dias
            </Button>
            <Button
              variant={selectedPeriod === '90' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('90')}
            >
              90 dias
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Buscar por nome, CPF ou benefício..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-64"
            />
            <Badge variant="outline">
              {filteredConsultations.length} registros
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando consultas...</p>
          </div>
        ) : filteredConsultations && filteredConsultations.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Benefício</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.map((consultation: any) => (
                  <TableRow key={consultation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(consultation.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {consultation.cpf || formatCPF(consultation.searchValue)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {consultation.beneficiaryName || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {consultation.benefitNumber || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-sm">
                          {consultation.benefitValue ? formatCurrency(consultation.benefitValue) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-blue-600" />
                        <span className="text-sm">
                          {consultation.availableMargin ? formatCurrency(consultation.availableMargin) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {consultation.loanBlocked ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Liberado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedConsultation(consultation)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Detalhes Completos da Consulta
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedConsultation && selectedConsultation.resultData && (
                            <ConsultationDetails 
                              consultation={selectedConsultation}
                              onExportPDF={generatePDF}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhuma consulta encontrada</h3>
            <p className="text-muted-foreground">
              Não foram encontradas consultas no período selecionado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}