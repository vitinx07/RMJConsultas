import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, ArrowLeft, Save, Trash2 } from "lucide-react";
import { useParams } from "wouter";

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  role: z.enum(["administrator", "gerente", "vendedor"]),
  isActive: z.boolean(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface UserData {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditUser() {
  const params = useParams();
  const id = params.id;
  const { toast } = useToast();
  const navigate = (path: string) => {
    window.location.href = path;
  };
  const queryClient = useQueryClient();

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "vendedor",
      isActive: true,
    },
  });

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserFormData) => {
      return await apiRequest(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      navigate("/users");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      navigate("/users");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Senha redefinida",
        description: response.emailSent 
          ? "Nova senha enviada por email." 
          : `Nova senha temporária: ${response.temporaryPassword}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Populate form when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role as "administrator" | "gerente" | "vendedor",
        isActive: user.isActive,
      });
    }
  }, [user, form]);

  const onSubmit = (data: UpdateUserFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleDeleteUser = () => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      deleteUserMutation.mutate();
    }
  };

  const handleResetPassword = () => {
    if (window.confirm("Tem certeza que deseja redefinir a senha deste usuário?")) {
      resetPasswordMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Usuário não encontrado</p>
        <Button onClick={() => navigate("/users")} variant="outline" className="mt-4">
          Voltar para Usuários
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <User className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Editar Usuário</h1>
        </div>
        <Button
          onClick={() => navigate("/users")}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="bg-gray-50 dark:bg-gray-700"
                />
                <p className="text-sm text-gray-500">O nome de usuário não pode ser alterado</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    placeholder="Nome"
                    {...form.register("firstName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Sobrenome"
                    {...form.register("lastName")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email (opcional)"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as "administrator" | "gerente" | "vendedor")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Usuário ativo</Label>
              </div>

              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="w-full"
              >
                {updateUserMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Redefinir Senha</h3>
              <p className="text-sm text-gray-600">
                Gere uma nova senha temporária para o usuário.
              </p>
              <Button
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {resetPasswordMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Redefinindo...</span>
                  </div>
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div className="space-y-2">
              <h3 className="font-medium text-red-600">Zona de Perigo</h3>
              <p className="text-sm text-gray-600">
                Exclua permanentemente este usuário. Esta ação não pode ser desfeita.
              </p>
              <Button
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {deleteUserMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Excluindo...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Usuário</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}