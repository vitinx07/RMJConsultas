import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { ClientMarkerDialog } from "./ClientMarkerDialog";

interface UnmarkedClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function UnmarkedClientsDialog({ 
  open, 
  onOpenChange,
  onComplete
}: UnmarkedClientsDialogProps) {
  const [selectedCpf, setSelectedCpf] = useState<string | null>(null);
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);

  // Buscar clientes não marcados pelo operador atual
  const { data: unmarkedClients = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/client-markers/unmarked"],
    enabled: open,
  });

  const handleMarkClient = (cpf: string) => {
    setSelectedCpf(cpf);
    setMarkerDialogOpen(true);
  };

  const handleMarkerDialogClose = () => {
    setMarkerDialogOpen(false);
    setSelectedCpf(null);
    // Refetch para atualizar a lista
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleContinueWithoutMarking = () => {
    onComplete();
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Verificando Clientes Não Marcados...</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Clientes Não Marcados
            </DialogTitle>
            <DialogDescription>
              Você possui {unmarkedClients.length} clientes consultados que ainda não foram marcados. 
              É obrigatório marcar todos os clientes para definir o status da negociação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {unmarkedClients.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-green-600 dark:text-green-400 text-lg font-medium">
                  ✓ Todos os clientes foram marcados!
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Você pode continuar com suas consultas.
                </p>
                <Button onClick={handleContinueWithoutMarking} className="mt-4">
                  Continuar
                </Button>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {unmarkedClients.map((client: any) => (
                    <div key={client.cpf} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs border text-orange-700 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Não Marcado
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">Nome:</span> {client.beneficiaryName}
                            </div>
                            <div>
                              <span className="font-medium">CPF:</span> {client.cpf}
                            </div>
                            <div>
                              <span className="font-medium">Benefício:</span> {client.benefitNumber}
                            </div>
                            <div>
                              <span className="font-medium">Consultado em:</span> {
                                new Date(client.createdAt).toLocaleString('pt-BR')
                              }
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleMarkClient(client.cpf)}
                          size="sm"
                          className="ml-4"
                        >
                          Marcar Cliente
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      É obrigatório marcar todos os clientes antes de continuar
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleContinueWithoutMarking}
                        disabled={unmarkedClients.length > 0}
                      >
                        Continuar Sem Marcar
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedCpf && (
        <ClientMarkerDialog
          open={markerDialogOpen}
          onOpenChange={setMarkerDialogOpen}
          cpf={selectedCpf}
          clientName={unmarkedClients?.find((c: any) => c.cpf === selectedCpf)?.beneficiaryName}
        />
      )}
    </>
  );
}