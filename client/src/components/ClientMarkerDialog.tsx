import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SelectClientMarker, clientMarkerStatusSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

const markerFormSchema = z.object({
  status: clientMarkerStatusSchema,
  notes: z.string().optional(),
});

type MarkerFormData = z.infer<typeof markerFormSchema>;

interface ClientMarkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cpf: string;
  clientName?: string;
  existingMarker?: SelectClientMarker;
}

const statusOptions = [
  { value: "em_negociacao", label: "Em Negociação" },
  { value: "finalizada", label: "Finalizada" },
  { value: "zerado", label: "Zerado" },
  { value: "tem_coisa_mas_nao_quer", label: "Tem Coisa mas Não Quer Fazer" },
  { value: "apenas_consulta", label: "Apenas Consulta" },
];

export function ClientMarkerDialog({ 
  open, 
  onOpenChange, 
  cpf, 
  clientName,
  existingMarker 
}: ClientMarkerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssuming, setIsAssuming] = useState(false);

  const form = useForm<MarkerFormData>({
    resolver: zodResolver(markerFormSchema),
    defaultValues: {
      status: existingMarker?.status as any || "em_negociacao",
      notes: existingMarker?.notes || "",
    },
  });

  // Mutation para criar/atualizar marcação
  const saveMarkerMutation = useMutation({
    mutationFn: async (data: MarkerFormData) => {
      if (existingMarker) {
        // Atualizar marcação existente
        return apiRequest(`/api/client-markers/${cpf}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        // Criar nova marcação
        return apiRequest("/api/client-markers", {
          method: "POST",
          body: JSON.stringify({
            cpf,
            ...data,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-markers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/client-markers/${cpf}`] });
      
      toast({
        title: "Sucesso",
        description: existingMarker 
          ? "Marcação atualizada com sucesso" 
          : "Cliente marcado com sucesso",
      });
      
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar marcação",
        variant: "destructive",
      });
    },
  });

  // Mutation para remover marcação (apenas administradores)
  const deleteMarkerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/client-markers/${cpf}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-markers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/client-markers/${cpf}`] });
      
      toast({
        title: "Sucesso",
        description: "Marcação removida com sucesso",
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover marcação",
        variant: "destructive",
      });
    },
  });

  // Mutation para assumir venda (operadores)
  const assumeSaleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/client-markers/${cpf}/assume`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-markers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/client-markers/${cpf}`] });
      
      toast({
        title: "Sucesso",
        description: "Venda assumida com sucesso",
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao assumir venda",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MarkerFormData) => {
    saveMarkerMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja remover esta marcação?")) {
      deleteMarkerMutation.mutate();
    }
  };

  const handleAssumeSale = () => {
    if (window.confirm("Você deseja assumir essa venda?")) {
      setIsAssuming(true);
      assumeSaleMutation.mutate();
    }
  };

  // Verificar permissões
  const canDelete = user?.role === "administrator";
  const canAssume = user?.role === "operador" && existingMarker && existingMarker.userId !== user.id;
  const isOwnMarker = existingMarker && existingMarker.userId === user?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingMarker ? "Editar Marcação" : "Marcar Cliente"}
          </DialogTitle>
          <DialogDescription>
            {clientName && (
              <div className="mb-2">
                <span className="font-medium">Cliente:</span> {clientName}
              </div>
            )}
            <div>
              <span className="font-medium">CPF:</span> {cpf}
            </div>
            {existingMarker && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-800 dark:text-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div>
                        <span className="font-medium">Marcado por:</span> {existingMarker.userName}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span> {existingMarker.createdAt ? new Date(existingMarker.createdAt).toLocaleString('pt-BR') : 'N/A'}
                      </div>
                      {existingMarker.assumedBy && existingMarker.assumedByName && (
                        <div className="mt-1 text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Assumido por:</span> {existingMarker.assumedByName}
                        </div>
                      )}
                    </div>
                  </div>
                  {existingMarker.notes && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs">
                      <span className="font-medium">Observações:</span> {existingMarker.notes}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status da Negociação</Label>
            <Select 
              value={form.watch("status")} 
              onValueChange={(value) => form.setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a negociação..."
              className="resize-none"
              rows={3}
              value={form.watch("notes") || ""}
              onChange={(e) => form.setValue("notes", e.target.value)}
            />
          </div>

            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {existingMarker && canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMarkerMutation.isPending}
                  >
                    {deleteMarkerMutation.isPending ? "Removendo..." : "Remover"}
                  </Button>
                )}
                
                {canAssume && existingMarker?.status === "em_negociacao" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAssumeSale}
                    disabled={assumeSaleMutation.isPending}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300"
                  >
                    {assumeSaleMutation.isPending ? "Assumindo..." : "Assumir Venda"}
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                
                {(isOwnMarker || !existingMarker) && (
                  <Button
                    type="submit"
                    disabled={saveMarkerMutation.isPending}
                  >
                    {saveMarkerMutation.isPending 
                      ? "Salvando..." 
                      : existingMarker 
                        ? "Atualizar" 
                        : "Marcar Cliente"
                    }
                  </Button>
                )}
              </div>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}