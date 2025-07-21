import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { SelectClientMarker, ClientMarkerStatus } from "@shared/schema";

interface ClientMarkerBadgeProps {
  marker?: SelectClientMarker;
  showDetails?: boolean;
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

export function ClientMarkerBadge({ marker, showDetails = false }: ClientMarkerBadgeProps) {
  if (!marker) return null;

  const config = statusConfig[marker.status as ClientMarkerStatus];
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      
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