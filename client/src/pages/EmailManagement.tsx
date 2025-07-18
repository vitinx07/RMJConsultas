import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, Users, UserCheck, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.object({
  recipients: z.array(z.string().min(1, "Destinatário inválido")).min(1, "Selecione pelo menos um destinatário"),
  subject: z.string().min(1, "Assunto é obrigatório").max(200, "Assunto muito longo"),
  message: z.string().min(1, "Mensagem é obrigatória").max(5000, "Mensagem muito longa"),
  isHtml: z.boolean().default(false),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface User {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
}

export default function EmailManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { user: currentUser } = useAuth();

  // Check if user is admin
  if (!currentUser || currentUser.role !== "administrator") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Apenas administradores podem acessar esta página.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipients: [],
      subject: "",
      message: "",
      isHtml: false,
    },
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      return await apiRequest("/api/admin/send-email", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Emails enviados",
        description: response.message,
      });
      form.reset();
      setSelectedUsers([]);
      setSelectAll(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar emails",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const usersWithEmail = users.filter(user => user.email && user.isActive);

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(usersWithEmail.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const onSubmit = (data: EmailFormData) => {
    sendEmailMutation.mutate({
      ...data,
      recipients: selectedUsers,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navbar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Usuários
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold">Gerenciamento de Emails</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {currentUser && (
            <div className="text-right">
              <p className="text-sm font-medium">
                Logado como: {currentUser.firstName || currentUser.username}
              </p>
              <div className="flex items-center justify-end space-x-1">
                <Shield className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">
                  Administrador
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Seleção de Destinatários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Selecionar Destinatários</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll" className="font-medium">
                Selecionar todos ({usersWithEmail.length} usuários)
              </Label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {usersWithEmail.map(user => (
                <div key={user.id} className="flex items-center space-x-2 p-2 rounded-lg border">
                  <Checkbox
                    id={user.id}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={user.id} className="font-medium">
                        {user.firstName} {user.lastName}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>

            {usersWithEmail.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Nenhum usuário ativo com email cadastrado</p>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <UserCheck className="w-4 h-4" />
              <span>{selectedUsers.length} usuário(s) selecionado(s)</span>
            </div>
          </CardContent>
        </Card>

        {/* Composição da Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Compor Mensagem</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Digite o assunto do email"
                  {...form.register("subject")}
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Digite sua mensagem..."
                  rows={8}
                  {...form.register("message")}
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-red-600">{form.formState.errors.message.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isHtml"
                  checked={form.watch("isHtml")}
                  onCheckedChange={(checked) => form.setValue("isHtml", checked)}
                />
                <Label htmlFor="isHtml">Enviar como HTML</Label>
              </div>

              <Button
                type="submit"
                disabled={selectedUsers.length === 0 || sendEmailMutation.isPending}
                className="w-full"
              >
                {sendEmailMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Enviar Email</span>
                  </div>
                )}
              </Button>

              {selectedUsers.length === 0 && (
                <p className="text-sm text-orange-600 text-center">
                  Selecione pelo menos um destinatário para enviar o email
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}