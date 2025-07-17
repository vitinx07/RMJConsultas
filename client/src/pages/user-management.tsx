import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, User, Shield, ShieldCheck, ArrowLeft, Mail, Key, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { User as UserType, CreateUser } from "@shared/schema";

const roleLabels = {
  administrator: "Administrador",
  gerente: "Gerente", 
  vendedor: "Vendedor"
};

const roleIcons = {
  administrator: ShieldCheck,
  gerente: Shield,
  vendedor: User
};

const roleColors = {
  administrator: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  gerente: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  vendedor: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
};

export default function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<CreateUser>({
    username: "",
    password: "",
    confirmPassword: "",
    role: "vendedor",
    firstName: "",
    lastName: "",
    email: "",
    isActive: true,
    generatePassword: false,
    sendPasswordByEmail: false,
  });

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar todos os usuários
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar usuários");
      }
      return response.json();
    },
    enabled: currentUser?.role === "administrator",
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUser) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar usuário");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        confirmPassword: "",
        role: "vendedor",
        firstName: "",
        lastName: "",
        email: "",
        isActive: true,
      });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar usuário");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar usuário",
        variant: "destructive",
      });
    },
  });

  // Mutation para redefinir senha
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao redefinir senha");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.emailSent 
          ? "Senha redefinida e enviada por email" 
          : `Senha redefinida. Nova senha: ${data.temporaryPassword}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao redefinir senha",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for password generation
    if (!newUser.generatePassword) {
      if (newUser.password !== newUser.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }

      if (newUser.password && newUser.password.length < 6) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for email sending
    if (newUser.sendPasswordByEmail && !newUser.email) {
      toast({
        title: "Erro",
        description: "Email é obrigatório quando 'Enviar senha por email' está marcado",
        variant: "destructive",
      });
      return;
    }

    await createUserMutation.mutateAsync(newUser);
    
    // Reset form
    setNewUser({
      username: "",
      password: "",
      confirmPassword: "",
      role: "vendedor",
      firstName: "",
      lastName: "",
      email: "",
      isActive: true,
      generatePassword: false,
      sendPasswordByEmail: false,
    });
    
    setIsCreateDialogOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode deletar seu próprio usuário",
        variant: "destructive",
      });
      return;
    }

    await deleteUserMutation.mutateAsync(userId);
  };

  const handleResetPassword = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode redefinir sua própria senha",
        variant: "destructive",
      });
      return;
    }

    await resetPasswordMutation.mutateAsync(userId);
  };

  if (currentUser?.role !== "administrator") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
            <CardDescription className="text-center">
              Apenas administradores podem acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erro ao Carregar</CardTitle>
            <CardDescription className="text-center">
              {error.message || "Erro ao carregar usuários"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Menu
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Crie e gerencie usuários do sistema
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {currentUser && (
            <div className="text-right">
              <p className="text-sm font-medium">
                Logado como: {currentUser.firstName || currentUser.username}
              </p>
              <div className="flex items-center justify-end space-x-1">
                {(() => {
                  const RoleIcon = roleIcons[currentUser.role as keyof typeof roleIcons] || User;
                  return <RoleIcon className="h-3 w-3" />;
                })()}
                <span className="text-xs text-muted-foreground">
                  {roleLabels[currentUser.role as keyof typeof roleLabels] || "Usuário"}
                </span>
              </div>
            </div>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Sobrenome"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Nome de usuário"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Papel</Label>
                  <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="administrator">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Password Generation Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generatePassword"
                      checked={newUser.generatePassword}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, generatePassword: !!checked })}
                    />
                    <Label htmlFor="generatePassword" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Gerar senha automaticamente
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendPasswordByEmail"
                      checked={newUser.sendPasswordByEmail}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, sendPasswordByEmail: !!checked })}
                      disabled={!newUser.email}
                    />
                    <Label htmlFor="sendPasswordByEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Enviar senha por email
                    </Label>
                  </div>
                  
                  {!newUser.generatePassword && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Senha"
                          required={!newUser.generatePassword}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={newUser.confirmPassword}
                          onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                          placeholder="Confirmar senha"
                          required={!newUser.generatePassword}
                        />
                      </div>
                    </div>
                  )}
                  
                  {newUser.sendPasswordByEmail && !newUser.email && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      ⚠️ Email é obrigatório quando "Enviar senha por email" está marcado
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            {users?.length || 0} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: UserType) => {
                  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.username
                          }
                        </div>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={roleColors[user.role as keyof typeof roleColors]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[user.role as keyof typeof roleLabels] || "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar edição
                              toast({
                                title: "Em desenvolvimento",
                                description: "Funcionalidade de edição será implementada em breve",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {user.id !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja redefinir a senha do usuário "{user.username}"? 
                                    {user.email 
                                      ? "A nova senha será enviada por email." 
                                      : "Uma nova senha temporária será gerada e exibida aqui."
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetPassword(user.id)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                    disabled={resetPasswordMutation.isPending}
                                  >
                                    {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {user.id !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar o usuário "{user.username}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}