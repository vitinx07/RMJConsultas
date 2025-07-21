import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { 
  UserCog, 
  Search, 
  Plus, 
  Calendar,
  User,
  MapPin,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Filter,
  Download,
  Bell,
  Users
} from "lucide-react";
import { ClientMarkerDialog } from "@/components/ClientMarkerDialog";
import { UnmarkedClientsDialog } from "@/components/UnmarkedClientsDialog";
import { useAuth } from "@/hooks/useAuth";
import { SelectClientMarker, ClientMarkerStatus } from "@shared/schema";
import { formatCPF } from "@/lib/utils";

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
};

function ClientMarkersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<SelectClientMarker | null>(null);
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);

  // Buscar todas as marcações
  const { data: markers = [], isLoading } = useQuery<SelectClientMarker[]>({
    queryKey: ["/api/client-markers"],
    queryFn: () => apiRequest("/api/client-markers"),
  });

  // Filtrar marcações com base no termo de busca
  const filteredMarkers = markers.filter(marker => 
    marker.cpf.includes(searchTerm.replace(/\D/g, '')) ||
    marker.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (marker.notes && marker.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditMarker = (marker: SelectClientMarker) => {
    setSelectedMarker(marker);
    setMarkerDialogOpen(true);
  };

  const handleDialogClose = () => {
    setMarkerDialogOpen(false);
    setSelectedMarker(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserCog className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Marcações de Clientes</h1>
            </div>
          </div>

          <div>
          </div>
        </div>

        {/* Search */}
        <Card className="w-full">
          {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CPF, operador ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando marcações...</div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && filteredMarkers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "Nenhuma marcação encontrada" : "Nenhuma marcação registrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm 
                  ? "Tente ajustar os termos de busca ou verificar a ortografia."
                  : "As marcações de clientes aparecerão aqui quando forem criadas pelos operadores."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Markers Grid */}
        {!isLoading && filteredMarkers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMarkers.map((marker) => {
              const config = statusConfig[marker.status as ClientMarkerStatus];
              const Icon = config.icon;

              return (
                <Card 
                  key={marker.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                  style={{ borderLeftColor: config.color.includes('orange') ? '#ea580c' : 
                           config.color.includes('green') ? '#16a34a' :
                           config.color.includes('red') ? '#dc2626' : '#6b7280' }}
                  onClick={() => handleEditMarker(marker)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={config.variant} className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMarker(marker);
                        }}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">CPF:</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCPF(marker.cpf)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {marker.userName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {marker.createdAt ? new Date(marker.createdAt).toLocaleString('pt-BR') : 'N/A'}
                        </span>
                      </div>

                      {marker.notes && (
                        <div className="mt-3 p-2 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Obs:</span> {marker.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Statistics */}
        {!isLoading && markers.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Resumo das Marcações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = markers.filter(m => m.status === status).length;
                  const Icon = config.icon;

                  return (
                    <div key={status} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Icon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{count}</div>
                      <div className="text-sm text-muted-foreground">{config.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Marker Dialog */}
        {selectedMarker && (
          <ClientMarkerDialog
            open={markerDialogOpen}
            onOpenChange={handleDialogClose}
            cpf={selectedMarker.cpf}
            existingMarker={selectedMarker}
          />
        )}
      </div>
    </div>
  );
}

export default ClientMarkersPage;