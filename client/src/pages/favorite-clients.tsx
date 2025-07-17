import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCPF, formatDate } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Star, Plus, Edit2, Trash2, Phone, Mail, MessageSquare, Calendar, User } from "lucide-react";

interface FavoriteClient {
  id: string;
  cpf: string;
  name: string;
  benefitNumber: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: "contactado" | "negociacao" | "finalizado";
  lastConsultation?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateFavoriteClient {
  cpf: string;
  name: string;
  benefitNumber: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: "contactado" | "negociacao" | "finalizado";
}

export default function FavoriteClients() {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<FavoriteClient | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery<FavoriteClient[]>({
    queryKey: ["/api/favorite-clients"],
    refetchInterval: 30000,
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: CreateFavoriteClient) => {
      return await apiRequest("/api/favorite-clients", {
        method: "POST",
        body: JSON.stringify(clientData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-clients"] });
      setIsAddingClient(false);
      toast({
        title: "Cliente adicionado",
        description: "Cliente foi adicionado aos favoritos com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message || "Não foi possível adicionar o cliente",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...clientData }: { id: string } & Partial<CreateFavoriteClient>) => {
      return await apiRequest(`/api/favorite-clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(clientData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-clients"] });
      setEditingClient(null);
      toast({
        title: "Cliente atualizado",
        description: "Dados do cliente foram atualizados com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Não foi possível atualizar o cliente",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/favorite-clients/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-clients"] });
      toast({
        title: "Cliente removido",
        description: "Cliente foi removido dos favoritos",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover cliente",
        description: error.message || "Não foi possível remover o cliente",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients?.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         client.cpf.includes(searchFilter.replace(/\D/g, "")) ||
                         client.benefitNumber.includes(searchFilter);
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "contactado": return "outline";
      case "negociacao": return "default";
      case "finalizado": return "secondary";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "contactado": return "Contactado";
      case "negociacao": return "Em Negociação";
      case "finalizado": return "Finalizado";
      default: return status;
    }
  };

  const ClientForm = ({ 
    client, 
    onSubmit, 
    onCancel, 
    isLoading 
  }: {
    client?: FavoriteClient;
    onSubmit: (data: CreateFavoriteClient) => void;
    onCancel: () => void;
    isLoading: boolean;
  }) => {
    const [formData, setFormData] = useState<CreateFavoriteClient>({
      cpf: client?.cpf || "",
      name: client?.name || "",
      benefitNumber: client?.benefitNumber || "",
      phone: client?.phone || "",
      email: client?.email || "",
      notes: client?.notes || "",
      status: client?.status || "contactado",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="benefitNumber">Número do Benefício</Label>
            <Input
              id="benefitNumber"
              value={formData.benefitNumber}
              onChange={(e) => setFormData({ ...formData, benefitNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="negociacao">Em Negociação</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Anotações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Anotações sobre o cliente..."
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : client ? "Atualizar" : "Adicionar"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clientes Favoritos</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes favoritos e acompanhe o status dos negócios
          </p>
        </div>
        <Button onClick={() => setIsAddingClient(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome, CPF ou número do benefício..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="negociacao">Em Negociação</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Client Form */}
      {isAddingClient && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adicionar Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm
              onSubmit={(data) => createClientMutation.mutate(data)}
              onCancel={() => setIsAddingClient(false)}
              isLoading={createClientMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Client Form */}
      {editingClient && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Editar Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm
              client={editingClient}
              onSubmit={(data) => updateClientMutation.mutate({ id: editingClient.id, ...data })}
              onCancel={() => setEditingClient(null)}
              isLoading={updateClientMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Clientes Favoritos ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum cliente favorito encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Benefício</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-32 truncate">
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatCPF(client.cpf)}</TableCell>
                      <TableCell>{client.benefitNumber}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(client.status)}>
                          {getStatusLabel(client.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {client.phone && (
                            <Phone className="h-3 w-3 text-muted-foreground" />
                          )}
                          {client.email && (
                            <Mail className="h-3 w-3 text-muted-foreground" />
                          )}
                          {client.notes && (
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(client.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingClient(client)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteClientMutation.mutate(client.id)}
                            disabled={deleteClientMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}