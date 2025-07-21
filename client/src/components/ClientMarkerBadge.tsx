import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, AlertTriangle, History, User, Calendar } from "lucide-react";
import { SelectClientMarker, ClientMarkerStatus, ClientMarkerHistory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientMarkerBadgeProps {
  marker?: SelectClientMarker;
  showDetails?: boolean;
  cpf?: string;
}

const statusConfig = {
  em_negociacao: {
    label: "Em Negociação",
    variant: "destructive" as const,
    icon: Clock,
    color: "text-orange-600",
  },
  finalizada: {
    label: "Finalizada",
    variant: "secondary" as const,
    icon: CheckCircle,
    color: "text-green-600",
  },
  zerado: {
    label: "Zerado",
    variant: "outline" as const,
    icon: XCircle,
    color: "text-gray-600",
  },
  tem_coisa_mas_nao_quer: {
    label: "Tem Coisa mas Não Quer",
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-red-600",
  },
  apenas_consulta: {
    label: "Apenas Consulta",
    variant: "outline" as const,
    icon: CheckCircle,
    color: "text-blue-600",
  },
};

const actionLabels = {
  created: "Criado",
  updated: "Atualizado", 
  assumed: "Assumido",
  removed: "Removido",
};

function ClientMarkerHistoryDialog({ cpf }: { cpf: string }) {
  const { data: history = [], isLoading } = useQuery<ClientMarkerHistory[]>({
    queryKey: [`/api/client-markers/${cpf}/history`],
    enabled: !!cpf,
  });

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Histórico Completo de Marcações</DialogTitle>
      </DialogHeader>
      
      <div className="max-h-96 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="text-center py-4">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum histórico encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry: ClientMarkerHistory, index: number) => {
              const isFirst = index === 0;
              const isLast = index === history.length - 1;
              
              return (
                <div key={entry.id} className="relative">
                  {/* Linha conectora */}
                  {!isLast && (
                    <div className="absolute left-4 top-8 w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    {/* Avatar/Indicador com cores específicas */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.action === 'created' ? 'bg-green-100 dark:bg-green-900' :
                      entry.action === 'updated' ? 'bg-blue-100 dark:bg-blue-900' :
                      entry.action === 'assumed' ? 'bg-orange-100 dark:bg-orange-900' :
                      'bg-red-100 dark:bg-red-900'
                    }`}>
                      {entry.action === 'created' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {entry.action === 'updated' && <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {entry.action === 'assumed' && <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                      {entry.action === 'removed' && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-sm">
                        {/* Cabeçalho da ação */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {entry.userName}
                              </span>
                              <span className="ml-1">
                                {entry.action === 'created' && 'criou a marcação inicial'}
                                {entry.action === 'updated' && 'atualizou o status'}
                                {entry.action === 'assumed' && 'assumiu a venda'}
                                {entry.action === 'removed' && 'removeu a marcação'}
                              </span>
                              {entry.previousUserName && entry.action === 'assumed' && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  {' '}de <strong>{entry.previousUserName}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.createdAt && formatDistanceToNow(new Date(entry.createdAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </div>
                        </div>
                        
                        {/* Status atual */}
                        <div className="mb-2">
                          <span className="text-sm">
                            <strong>Status definido:</strong>{' '}
                            <Badge variant={statusConfig[entry.status as ClientMarkerStatus]?.variant || "outline"} className="text-xs">
                              {statusConfig[entry.status as ClientMarkerStatus]?.label || entry.status}
                            </Badge>
                          </span>
                        </div>
                        
                        {/* Observações */}
                        {entry.notes && (
                          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                            <strong>Observações:</strong> {entry.notes}
                          </div>
                        )}
                        
                        {/* Informações de mudança */}
                        {(entry.previousUserName || entry.previousStatus) && (
                          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                            {entry.action === 'assumed' && entry.previousUserName && (
                              <div>
                                <strong>Assumiu de:</strong> <span className="text-gray-700 dark:text-gray-300">{entry.previousUserName}</span>
                                {entry.previousStatus && (
                                  <span className="ml-2">
                                    (que tinha definido: <Badge variant="outline" className="text-xs ml-1">
                                      {statusConfig[entry.previousStatus as ClientMarkerStatus]?.label || entry.previousStatus}
                                    </Badge>)
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {entry.action === 'updated' && entry.previousStatus && entry.previousStatus !== entry.status && (
                              <div>
                                <strong>Mudou de:</strong> 
                                <Badge variant="outline" className="text-xs ml-1 mr-2">
                                  {statusConfig[entry.previousStatus as ClientMarkerStatus]?.label || entry.previousStatus}
                                </Badge>
                                <strong>para:</strong>
                                <Badge variant={statusConfig[entry.status as ClientMarkerStatus]?.variant || "outline"} className="text-xs ml-1">
                                  {statusConfig[entry.status as ClientMarkerStatus]?.label || entry.status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export function ClientMarkerBadge({ marker, showDetails = false, cpf }: ClientMarkerBadgeProps) {
  if (!marker) return null;

  const config = statusConfig[marker.status as ClientMarkerStatus];
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        
        {cpf && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <History className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <ClientMarkerHistoryDialog cpf={cpf} />
          </Dialog>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <span className="font-medium">Operador:</span>
            <span>{marker.userName}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Data:</span>
            <span>{marker.createdAt ? new Date(marker.createdAt).toLocaleString('pt-BR') : 'N/A'}</span>
          </div>
          {marker.assumedByName && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Assumido por:</span>
              <span>{marker.assumedByName}</span>
            </div>
          )}
          {marker.notes && (
            <div className="flex items-start gap-1">
              <span className="font-medium">Obs:</span>
              <span className="flex-1">{marker.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}