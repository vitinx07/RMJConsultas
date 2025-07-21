import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, Users, UserCheck, AlertCircle, ArrowLeft, Shield, Paperclip, Upload, X } from "lucide-react";
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

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
    mutationFn: async (data: any) => {
      console.log("Fazendo requisição para:", "/api/admin/send-email");
      console.log("Dados enviados:", data);

      const response = await apiRequest("/api/admin/send-email", {
        method: "POST",
        body: JSON.stringify(data),
      });

      console.log("Resposta recebida:", response);
      return response;
    },
    onSuccess: (response) => {
      console.log("Sucesso no envio:", response);
      toast({
        title: "✅ Emails Enviados com Sucesso",
        description: `${response.message || `${response.totalSent || 0} de ${response.totalRequested || 0} emails enviados`}`,
        variant: "default",
      });

      // Resetar formulário
      form.reset();
      setSelectedUsers([]);
      setSelectAll(false);
      setAttachments([]);
    },
    onError: (error: any) => {
      console.error("Erro detalhado:", error);

      let errorMessage = "Erro desconhecido ao enviar emails";
      let errorTitle = "Erro no Envio";

      if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.status === 400) {
        errorTitle = "Dados Inválidos";
        errorMessage = error.message || "Verifique os dados informados";
      } else if (error?.status === 401) {
        errorTitle = "Acesso Negado";
        errorMessage = "Você não tem permissão para enviar emails";
      } else if (error?.status === 500) {
        errorTitle = "Erro do Servidor";
        errorMessage = "Erro interno do servidor. Tente novamente em alguns minutos.";
      }

      toast({
        title: `❌ ${errorTitle}`,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const usersWithEmail = users.filter(user => user.email && user.isActive);

  const handleUserSelection = (userId: string, checked: boolean) => {
    let newSelectedUsers;
    if (checked) {
      newSelectedUsers = [...selectedUsers, userId];
      setSelectedUsers(newSelectedUsers);
    } else {
      newSelectedUsers = selectedUsers.filter(id => id !== userId);
      setSelectedUsers(newSelectedUsers);
      setSelectAll(false);
    }

    // Sincronizar com o formulário
    form.setValue("recipients", newSelectedUsers);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    let newSelectedUsers;
    if (checked) {
      newSelectedUsers = usersWithEmail.map(user => user.id);
      setSelectedUsers(newSelectedUsers);
    } else {
      newSelectedUsers = [];
      setSelectedUsers(newSelectedUsers);
    }

    // Sincronizar com o formulário
    form.setValue("recipients", newSelectedUsers);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessingFiles(true);
    const files = Array.from(event.target.files || []);
    setAttachments(files);
    setIsProcessingFiles(false);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const onSubmit = (data: EmailFormData) => {
    console.log("=== ONSUBMIT EXECUTADO ===");
    console.log("Dados do formulário:", data);
    console.log("Usuários selecionados:", selectedUsers);

    // Usar os recipients do formulário (que agora está sincronizado)
    const emailData = {
      recipients: data.recipients.length > 0 ? data.recipients : selectedUsers,
      subject: data.subject.trim(),
      message: data.message.trim(),
      isHtml: data.isHtml || false,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    console.log("Dados finais do email:", emailData);
    sendEmailMutation.mutate(emailData);
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
          <Link href="/usuarios">
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
                <textarea
                  id="message"
                  placeholder="Digite sua mensagem..."
                  rows={8}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Anexos</Label>
                  <Badge variant="secondary" className="text-xs">
                    Máx: 25MB por arquivo
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* File Input */}
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isProcessingFiles}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.xlsx,.xls,.ppt,.pptx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {isProcessingFiles ? "Processando arquivos..." : "Clique para selecionar arquivos ou arraste aqui"}
                      </span>
                    </label>
                  </div>

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Arquivos selecionados ({attachments.length})
                      </Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md border"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm truncate" title={attachment.name}>
                                {attachment.name}
                              </span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {(attachment.size / 1024 / 1024).toFixed(1)}MB
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  sendEmailMutation.isPending || 
                  selectedUsers.length === 0 || 
                  !form.watch("subject")?.trim() || 
                  !form.watch("message")?.trim()
                }
                className="w-full"
              >
                {sendEmailMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando Email...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Enviar Email</span>
                  </div>
                )}
              </Button>

              {/* Status de validação */}
              <div className="space-y-2">
                {selectedUsers.length === 0 && (
                  <p className="text-sm text-orange-600 text-center flex items-center justify-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Selecione pelo menos um destinatário para enviar o email</span>
                  </p>
                )}

                {selectedUsers.length > 0 && !form.watch("subject")?.trim() && (
                  <p className="text-sm text-orange-600 text-center flex items-center justify-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Digite o assunto do email</span>
                  </p>
                )}

                {selectedUsers.length > 0 && form.watch("subject")?.trim() && !form.watch("message")?.trim() && (
                  <p className="text-sm text-orange-600 text-center flex items-center justify-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Digite a mensagem do email</span>
                  </p>
                )}

                {selectedUsers.length > 0 && form.watch("subject")?.trim() && form.watch("message")?.trim() && !sendEmailMutation.isPending && (
                  <p className="text-sm text-green-600 text-center flex items-center justify-center space-x-1">
                    <UserCheck className="w-4 h-4" />
                    <span>Pronto para enviar para {selectedUsers.length} destinatário(s)</span>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}