import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Bell, BellOff, Check, AlertCircle, Info, TrendingUp, Settings } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  benefitNumber?: string;
  cpf?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/notifications/${id}/read`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível marcar como lida",
        variant: "destructive",
      });
    },
  });

  const filteredNotifications = notifications?.filter(notification => {
    switch (filter) {
      case "unread": return !notification.isRead;
      case "read": return notification.isRead;
      default: return true;
    }
  }) || [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "benefit_status_change":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "margin_increase":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "system_alert":
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "benefit_status_change":
        return "Mudança de Status";
      case "margin_increase":
        return "Aumento de Margem";
      case "system_alert":
        return "Alerta do Sistema";
      default:
        return "Notificação";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>Erro ao carregar notificações</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            Acompanhe atualizações e alertas importantes do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount && unreadCount.count > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {unreadCount.count} não lidas
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todas ({notifications?.length || 0})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Não lidas ({unreadCount?.count || 0})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("read")}
            >
              Lidas ({(notifications?.length || 0) - (unreadCount?.count || 0)})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>
                  {filter === "all" && "Nenhuma notificação encontrada"}
                  {filter === "unread" && "Nenhuma notificação não lida"}
                  {filter === "read" && "Nenhuma notificação lida"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${
                !notification.isRead
                  ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getNotificationIcon(notification.type)}
                      <Badge variant="outline" className="text-xs">
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="text-xs">
                          Nova
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold mb-1">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    
                    {(notification.benefitNumber || notification.cpf) && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {notification.benefitNumber && (
                          <Badge variant="outline" className="text-xs">
                            Benefício: {notification.benefitNumber}
                          </Badge>
                        )}
                        {notification.cpf && (
                          <Badge variant="outline" className="text-xs">
                            CPF: {notification.cpf}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {notification.metadata && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
                        <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Card */}
      {notifications && notifications.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resumo das Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {notifications.length}
                </div>
                <p className="text-sm text-muted-foreground">Total de notificações</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {unreadCount?.count || 0}
                </div>
                <p className="text-sm text-muted-foreground">Não lidas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {notifications.length - (unreadCount?.count || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Lidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}