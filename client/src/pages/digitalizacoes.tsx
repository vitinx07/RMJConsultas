import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  FileText, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Search,
  Filter,
  Download,
  User,
  DollarSign,
  Calendar,
  CreditCard,
  Shield,
  RefreshCw,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface C6Digitization {
  id: string;
  cpf: string;
  clientName: string;
  proposalNumber: string;
  userId: string;
  selectedContracts: string[];
  creditCondition: any;
  selectedInsurance: string;
  requestedAmount: number;
  installmentAmount: number;
  clientAmount: number;
  formalizationLink: string | null;
  status: string;
  createdAt: string;
  user?: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function DigitalizacoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [proposalReport, setProposalReport] = useState<any>(null);
  const [isConsultingProposal, setIsConsultingProposal] = useState<string | null>(null);
  const [isConsultingMovement, setIsConsultingMovement] = useState<string | null>(null);

  const { data: digitizations = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/c6-digitizations'],
    enabled: !!user,
  });

  // Mutation para atualizar status das digitalizações
  const refreshStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/c6-digitizations/refresh-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar status');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/c6-digitizations'] });
      toast({
        title: "Status Atualizados",
        description: `${data.updatedCount} digitalizações foram atualizadas com sucesso`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Atualização",
        description: error.message || "Não foi possível atualizar os status das digitalizações",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  // Função auxiliar para formatar valores monetários com segurança
  const formatCurrency = (value: number | null | undefined): string => {
    const numValue = Number(value) || 0;
    return numValue.toFixed(2);
  };

  // Função para formatar datas seguindo o padrão brasileiro
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Componente para exibir o relatório detalhado da proposta em modal
  const ProposalReportModal = ({ data, isOpen, onClose }: { data: any, isOpen: boolean, onClose: () => void }) => {
    if (!data) return null;

    const dadosCompletos = data.dadosCompletos || {};
    const client = dadosCompletos.client || {};
    const creditCondition = dadosCompletos.credit_condition || {};
    const loanTrack = dadosCompletos.loan_track || {};
    const liberations = dadosCompletos.liberations || [];
    const origins = dadosCompletos.origins || [];

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  ═════════════════════════════════════════════════
                </div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100 my-2">
                  RELATÓRIO DA PROPOSTA
                </div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  ═════════════════════════════════════════════════
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
          {/* DADOS PRINCIPAIS */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">
              📋 DADOS PRINCIPAIS
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex">
                <span className="font-medium w-48">Número da Proposta:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {dadosCompletos.proposal_number || 'N/A'}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Cliente:</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  {client.name || 'N/A'}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">CPF:</span>
                <span className="font-mono">{client.tax_identifier || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Matrícula:</span>
                <span className="font-mono">{client.enrolment || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Tipo de Operação:</span>
                <span>{dadosCompletos.operation_type || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Data de Registro:</span>
                <span>{formatDate(dadosCompletos.registration_date)}</span>
              </div>
            </div>
          </div>

          {/* STATUS ATUAL */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">
              🔄 STATUS ATUAL
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex">
                <span className="font-medium w-48">Situação:</span>
                <Badge variant={loanTrack.situation === 'APR' ? 'default' : 'secondary'}>
                  {loanTrack.situation || 'N/A'}
                </Badge>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Atividade Atual:</span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  {loanTrack.current_activity_description || 'N/A'}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Código da Atividade:</span>
                <span className="font-mono">{loanTrack.current_activity_number || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Última Atualização:</span>
                <span>{formatDate(loanTrack.activity_last_update)}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-48">Status Formalização:</span>
                <Badge variant="outline">
                  {dadosCompletos.formalization_status || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          {/* CONDIÇÕES DE CRÉDITO */}
          {Object.keys(creditCondition).length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">
                💰 CONDIÇÕES DE CRÉDITO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex">
                  <span className="font-medium w-48">Valor Solicitado:</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    R$ {(creditCondition.requested_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">Valor Bruto:</span>
                  <span className="font-semibold">
                    R$ {(creditCondition.gross_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">Valor Líquido:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    R$ {(creditCondition.net_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">Valor da Parcela:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    R$ {(creditCondition.installment_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">Quantidade de Parcelas:</span>
                  <span className="font-semibold">{creditCondition.installment_quantity || 0}x</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">IOF:</span>
                  <span>R$ {(creditCondition.iof_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">Primeiro Vencimento:</span>
                  <span>{formatDate(creditCondition.first_due_date)}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-48">Último Vencimento:</span>
                  <span>{formatDate(creditCondition.last_due_date)}</span>
                </div>
              </div>

              {/* Taxas */}
              {creditCondition.taxes && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded">
                  <h4 className="font-semibold mb-2">📊 Taxas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                    <div>Taxa Mensal Cliente: {creditCondition.taxes.monthly_customer_rate || 0}%</div>
                    <div>Taxa Anual Cliente: {creditCondition.taxes.annual_customer_rate || 0}%</div>
                    <div>CET Mensal: {creditCondition.taxes.monthly_effective_total_cost_rate || 0}%</div>
                    <div>CET Anual: {creditCondition.taxes.annual_effective_total_cost_rate || 0}%</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIBERAÇÕES */}
          {liberations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">
                🏦 LIBERAÇÕES
              </h3>
              <div className="space-y-3">
                {liberations.map((lib: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Beneficiário:</span> {lib.beneficiary_type}</div>
                      <div><span className="font-medium">Valor:</span> R$ {(lib.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div><span className="font-medium">Forma:</span> {lib.way_liberation}</div>
                      <div><span className="font-medium">Documento:</span> {lib.document_type}</div>
                      {lib.bank_code && <div><span className="font-medium">Banco:</span> {lib.bank_code}</div>}
                      {lib.agency_number && <div><span className="font-medium">Agência:</span> {lib.agency_number}-{lib.agency_digit}</div>}
                      {lib.account_number && <div><span className="font-medium">Conta:</span> {lib.account_number}-{lib.account_digit}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DADOS DO CLIENTE */}
          {client.address && client.address.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">
                👤 DADOS DO CLIENTE
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Estado Civil:</span> {client.marital_state || 'N/A'}</div>
                <div><span className="font-medium">Data Nascimento:</span> {formatDate(client.birth_date)}</div>
                
                {client.address[0] && (
                  <div>
                    <span className="font-medium">Endereço:</span> {client.address[0].street} {client.address[0].number}, {client.address[0].neighborhood} - {client.address[0].city}/{client.address[0].federation_unit} - CEP: {client.address[0].zip_code}
                  </div>
                )}
                
                {client.phone_numbers && client.phone_numbers[0] && (
                  <div>
                    <span className="font-medium">Telefone:</span> ({client.phone_numbers[0].phone_number_area_code}) {client.phone_numbers[0].phone_number}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOTÃO PARA FECHAR */}
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Fechar Relatório
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Função para consultar proposta na API C6
  const consultarProposta = async (proposalNumber: string) => {
    setIsConsultingProposal(proposalNumber);
    try {
      const response = await fetch('/api/c6-bank/consultar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalNumber }),
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar proposta');
      }

      const data = await response.json();
      
      // Exibir relatório detalhado da proposta
      setProposalReport(data);
      
      toast({
        title: "Relatório da Proposta Gerado",
        description: "Consulte os detalhes completos abaixo",
        duration: 3000,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.status === 404 ? 
        "Proposta não encontrada no sistema C6 Bank" :
        "Não foi possível consultar a proposta";
      
      toast({
        title: "Erro na Consulta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConsultingProposal(null);
    }
  };

  // Função para consultar movimentação da proposta
  const consultarMovimentacao = async (proposalNumber: string) => {
    setIsConsultingMovement(proposalNumber);
    try {
      const response = await fetch('/api/c6-bank/consultar-movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalNumber }),
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar movimentação');
      }

      const data = await response.json();
      
      // Exibir movimentações detalhadas
      const movimentacoes = data.movements || [];
      const observacoes = data.observations || [];
      const totalItens = movimentacoes.length + observacoes.length;

      toast({
        title: "Movimentação Consultada",
        description: `Situação: ${data.situacao || 'N/A'} | ${totalItens} registros encontrados`,
        duration: 5000,
      });

      // Log detalhado no console para debugging
      console.log('📊 Movimentações da proposta:', {
        numero: data.proposalNumber,
        situacao: data.situacao,
        atividade: data.atividadeAtual,
        movimentacoes: movimentacoes,
        observacoes: observacoes,
        loanTrack: data.loanTrack
      });
    } catch (error: any) {
      const errorMessage = error?.response?.status === 404 ? 
        "Movimentações ainda não disponíveis para esta proposta" :
        "Não foi possível consultar a movimentação";
      
      toast({
        title: "Erro na Movimentação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConsultingMovement(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'APROVADA':
        return 'default';
      case 'rejected':
      case 'REJEITADA':
      case 'CANCELADA':
        return 'destructive';
      case 'pending':
      case 'PENDENTE':
      case 'EM_ANALISE':
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
      case 'APROVADA':
        return 'Aprovada';
      case 'rejected':
      case 'REJEITADA':
        return 'Rejeitada';
      case 'CANCELADA':
        return 'Cancelada';
      case 'EM_ANALISE':
        return 'Em Análise de Crédito';
      case 'pending':
      case 'PENDENTE':
      default:
        return 'Pendente';
    }
  };

  const filteredDigitizations = (digitizations as C6Digitization[]).filter((dig: C6Digitization) => {
    const matchesSearch = 
      dig.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dig.cpf.includes(searchTerm) ||
      dig.proposalNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || dig.status === statusFilter;
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const digitizationDate = new Date(dig.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - digitizationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-6 pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Histórico de Digitalizações C6 Bank</h1>
        <p className="text-muted-foreground">
          Visualize todas as propostas digitalizadas e seus status
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, CPF ou proposta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="approved">Aprovada</option>
                <option value="rejected">Rejeitada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            
            <div>
              <Label>Período</Label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
              </select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button
                onClick={() => refreshStatusMutation.mutate()}
                disabled={refreshStatusMutation.isPending}
                variant="default"
                className="flex-1 gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshStatusMutation.isPending ? 'animate-spin' : ''}`} />
                {refreshStatusMutation.isPending ? 'Verificando...' : 'Verificar Status'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Digitalizações */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>Carregando digitalizações...</p>
        </div>
      ) : filteredDigitizations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma digitalização encontrada</p>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? "Tente ajustar os filtros de busca"
                : "As digitalizações C6 Bank aparecerão aqui"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredDigitizations.map((digitization: C6Digitization) => (
            <Card key={digitization.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {digitization.clientName}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        CPF: {digitization.cpf}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Proposta: {digitization.proposalNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(digitization.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(digitization.status)}>
                      {getStatusLabel(digitization.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Informações Financeiras */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Valores
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Valor Solicitado:</span>
                        <span className="font-medium text-green-600">
                          R$ {formatCurrency(digitization.requestedAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Parcela:</span>
                        <span className="font-medium">
                          R$ {formatCurrency(digitization.installmentAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">Troco:</span>
                        <span className="font-bold text-blue-600">
                          R$ {formatCurrency(digitization.clientAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contratos */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Contratos
                    </h4>
                    <div className="space-y-1">
                      {(digitization.selectedContracts || []).map((contract: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">{contract}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(contract, "Contrato")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seguro */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Seguro
                    </h4>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {digitization.selectedInsurance || "Não informado"}
                      </span>
                    </div>
                  </div>

                  {/* Operador e Ações */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Operador
                    </h4>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {digitization.user?.firstName || digitization.user?.username || "N/A"}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => consultarProposta(digitization.proposalNumber)}
                        disabled={isConsultingProposal === digitization.proposalNumber}
                        className="w-full flex items-center gap-2"
                      >
                        {isConsultingProposal === digitization.proposalNumber ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        Consultar Proposta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => consultarMovimentacao(digitization.proposalNumber)}
                        disabled={isConsultingMovement === digitization.proposalNumber}
                        className="w-full flex items-center gap-2"
                      >
                        {isConsultingMovement === digitization.proposalNumber ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        Ver Movimentação
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Link de Formalização */}
                {digitization.formalizationLink && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold mb-1">Link de Formalização</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Link para o cliente finalizar a proposta
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(digitization.formalizationLink!, "Link de formalização")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(digitization.formalizationLink!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-background rounded border font-mono text-xs break-all">
                      {digitization.formalizationLink}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal do Relatório Detalhado da Proposta */}
      <ProposalReportModal 
        data={proposalReport} 
        isOpen={!!proposalReport} 
        onClose={() => setProposalReport(null)} 
      />
      </div>
    </>
  );
}