import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Clock, Key, RefreshCw } from "lucide-react";

export default function PasswordExpiryDemo() {
  const queryClient = useQueryClient();

  // Buscar status atual da senha
  const { data: passwordStatus, isLoading } = useQuery({
    queryKey: ['/api/auth/password-status'],
    refetchInterval: 10000
  });

  // Simular expiração em 1 dia para teste
  const simulateExpiry = useMutation({
    mutationFn: async (days: number) => {
      return apiRequest('/api/auth/simulate-expiry', {
        method: 'POST',
        body: JSON.stringify({ daysToExpiry: days })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/password-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!passwordStatus) return <Badge variant="outline">Carregando...</Badge>;

    if (passwordStatus.mustChangePassword) {
      return <Badge variant="destructive">Alteração Obrigatória</Badge>;
    } else if (passwordStatus.isExpired) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else if (passwordStatus.shouldShowWarning) {
      return <Badge variant="destructive">Expira em {passwordStatus.daysUntilExpiry} dia(s)</Badge>;
    } else if (passwordStatus.daysUntilExpiry && passwordStatus.daysUntilExpiry > 0) {
      return <Badge variant="secondary">Válida por {passwordStatus.daysUntilExpiry} dia(s)</Badge>;
    }
    
    return <Badge variant="outline">Status Indefinido</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sistema de Expiração de Senhas</h1>
          <p className="text-muted-foreground mt-2">
            Demonstração do sistema de expiração automática de senhas a cada 30 dias
          </p>
        </div>

        {passwordStatus?.shouldShowWarning && passwordStatus.warningMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {passwordStatus.warningMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Status da Senha
              </CardTitle>
              <CardDescription>
                Informações sobre a validade da sua senha atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge()}
              </div>

              {passwordStatus?.passwordExpiresAt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expira em:</span>
                    <span className="text-sm font-medium">
                      {new Date(passwordStatus.passwordExpiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dias restantes:</span>
                    <span className={`text-sm font-medium ${
                      (passwordStatus.daysUntilExpiry || 0) <= 3 ? 'text-red-600' : 
                      (passwordStatus.daysUntilExpiry || 0) <= 7 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(passwordStatus.daysUntilExpiry && passwordStatus.daysUntilExpiry > 0) ? passwordStatus.daysUntilExpiry : 0} dias
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alteração obrigatória:</span>
                <Badge variant={passwordStatus?.mustChangePassword ? "destructive" : "secondary"}>
                  {passwordStatus?.mustChangePassword ? "Sim" : "Não"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Teste de Expiração
              </CardTitle>
              <CardDescription>
                Simule diferentes cenários de expiração para testar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => simulateExpiry.mutate(3)}
                  disabled={simulateExpiry.isPending}
                >
                  Simular: Expira em 3 dias
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => simulateExpiry.mutate(2)}
                  disabled={simulateExpiry.isPending}
                >
                  Simular: Expira em 2 dias
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => simulateExpiry.mutate(1)}
                  disabled={simulateExpiry.isPending}
                >
                  Simular: Expira em 1 dia
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={() => simulateExpiry.mutate(0)}
                  disabled={simulateExpiry.isPending}
                >
                  Simular: Senha Expirada
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => simulateExpiry.mutate(30)}
                  disabled={simulateExpiry.isPending}
                >
                  Resetar: 30 dias
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Este é um ambiente de teste. As simulações alteram temporariamente 
                  a data de expiração da sua senha para demonstrar o funcionamento do sistema.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona o Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">📅 Expiração Automática</h4>
                <p className="text-sm text-muted-foreground">
                  Todas as senhas expiram automaticamente após 30 dias da criação ou última alteração.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">⚠️ Alertas Antecipados</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema envia alertas 3, 2 e 1 dia antes da expiração via notificações e emails.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🔒 Bloqueio Automático</h4>
                <p className="text-sm text-muted-foreground">
                  Senhas expiradas são automaticamente marcadas para alteração obrigatória.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">📧 Notificações por Email</h4>
                <p className="text-sm text-muted-foreground">
                  Emails são enviados automaticamente com instruções para alteração de senha.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}