import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActiveNegotiation {
  cpf: string;
  clientName: string | null;
  operatorName: string;
  assumedByName: string | null;
  createdAt: string;
  negotiationExpiresAt: string | null;
  negotiationDurationHours: number | null;
  notes: string | null;
  timeRemaining: string | null;
  isExpired: boolean;
}

export default function NegotiationsControl() {
  const { user } = useAuth();

  // Verificar permissões
  if (!user || (user.role !== "administrator" && user.role !== "gerente")) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas gerentes e administradores podem acessar este controle.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: negotiations = [], isLoading, refetch } = useQuery<ActiveNegotiation[]>({
    queryKey: ["/api/admin/negotiations-control"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const activeCount = negotiations.filter(n => !n.isExpired).length;
  const expiredCount = negotiations.filter(n => n.isExpired).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Negociações</h1>
          <p className="text-muted-foreground">
            Monitore todas as negociações ativas para prevenir fraudes e garantir acompanhamento
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociações Ativas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirando Hoje</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {negotiations.filter(n => {
                if (!n.negotiationExpiresAt) return false;
                const expires = new Date(n.negotiationExpiresAt);
                const now = new Date();
                const timeDiff = expires.getTime() - now.getTime();
                return timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000; // Menos de 24h
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Próximas do vencimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando limpeza</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Negociações */}
      <Card>
        <CardHeader>
          <CardTitle>Negociações Ativas</CardTitle>
          <CardDescription>
            Todas as negociações em andamento no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Carregando negociações...</p>
            </div>
          ) : negotiations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma Negociação Ativa</h3>
              <p className="text-muted-foreground">
                Não há negociações em andamento no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {negotiations.map((negotiation) => (
                <div
                  key={negotiation.cpf}
                  className={`p-4 border rounded-lg ${
                    negotiation.isExpired 
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {negotiation.clientName || `CPF ${negotiation.cpf}`}
                        </h4>
                        {negotiation.isExpired ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : (
                          <Badge variant="secondary">Em Negociação</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">CPF:</span> {negotiation.cpf}
                        </div>
                        <div>
                          <span className="font-medium">Operador:</span> {negotiation.operatorName}
                        </div>
                        {negotiation.assumedByName && (
                          <div>
                            <span className="font-medium">Assumido por:</span> {negotiation.assumedByName}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Iniciado:</span>{' '}
                          {formatDistanceToNow(new Date(negotiation.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      </div>

                      {negotiation.negotiationExpiresAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          {negotiation.isExpired ? (
                            <span className="text-red-600 font-medium">
                              Expirou {formatDistanceToNow(new Date(negotiation.negotiationExpiresAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          ) : (
                            <span>
                              <span className="font-medium">Expira em:</span> {negotiation.timeRemaining}
                              {' '}({formatDistanceToNow(new Date(negotiation.negotiationExpiresAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })})
                            </span>
                          )}
                        </div>
                      )}

                      {negotiation.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Observações:</span> {negotiation.notes}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <div>Prazo: {negotiation.negotiationDurationHours || 2}h</div>
                      {negotiation.assumedByName && (
                        <Badge variant="outline" className="mt-1">
                          <User className="w-3 h-3 mr-1" />
                          Assumida
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}