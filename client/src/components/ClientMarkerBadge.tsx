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
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Histórico de Marcações</DialogTitle>
      </DialogHeader>
      
      <div className="max-h-96 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="text-center py-4">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum histórico encontrado
          </div>
        ) : (
          history.map((entry: ClientMarkerHistory) => (
            <div key={entry.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {actionLabels[entry.action as keyof typeof actionLabels] || entry.action}
                  </Badge>
                  <span className="text-sm font-medium">
                    {statusConfig[entry.status as ClientMarkerStatus]?.label || entry.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {entry.createdAt && formatDistanceToNow(new Date(entry.createdAt), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3" />
                <span className="font-medium">{entry.userName}</span>
              </div>
              
              {entry.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Observações:</strong> {entry.notes}
                </div>
              )}
              
              {entry.previousUserName && (
                <div className="text-xs text-muted-foreground">
                  Anterior: {entry.previousUserName} 
                  {entry.previousStatus && ` (${statusConfig[entry.previousStatus as ClientMarkerStatus]?.label || entry.previousStatus})`}
                </div>
              )}
            </div>
          ))
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