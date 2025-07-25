import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'pending':
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
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
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

                  {/* Operador */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Operador
                    </h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {digitization.user?.firstName || digitization.user?.username || "N/A"}
                      </span>
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
    </div>
  );
}