import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import { 
  Users, 
  Search, 
  Clock, 
  Calendar,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Star,
  Bell,
  DollarSign,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";

interface DashboardStats {
  totalConsultations: number;
  consultationsToday: number;
  consultationsThisWeek: number;
  consultationsThisMonth: number;
  consultationsByCpf: number;
  consultationsByBenefit: number;
  favoriteClients: number;
  unreadNotifications: number;
  topUsers: Array<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    consultationCount: number;
  }>;
  marginDistribution: Array<{
    range: string;
    count: number;
  }>;
  blockedLoansCount: number;
  unblockedLoansCount: number;
  averageMargin: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrator";
  const isManager = user?.role === "gerente";
  const canViewGlobalStats = isAdmin || isManager;

  // Date filters state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Clear filters function
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // Fetch dashboard stats based on user role
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: canViewGlobalStats 
      ? ["/api/dashboard/stats", { startDate, endDate }] 
      : ["/api/dashboard/user-stats", { startDate, endDate }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-20">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Erro ao carregar estatísticas do dashboard</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    color = "default" 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string; 
    color?: string;
  }) => (
    <Card className={`${color === 'primary' ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color === 'primary' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color === 'primary' ? 'text-blue-700 dark:text-blue-300' : ''}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {canViewGlobalStats 
              ? "Visão geral do sistema - Todas as consultas"
              : "Suas estatísticas pessoais"
            }
          </p>
        </div>
        {unreadCount && unreadCount.count > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {unreadCount.count} notificações
          </Badge>
        )}
      </div>

      {/* Date Filter Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtro por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Consultas"
          value={stats?.totalConsultations || 0}
          icon={Search}
          description="Todas as consultas realizadas"
          color="primary"
        />
        
        <StatCard
          title="Consultas Hoje"
          value={stats?.consultationsToday || 0}
          icon={Clock}
          description="Consultas realizadas hoje"
        />
        
        <StatCard
          title="Esta Semana"
          value={stats?.consultationsThisWeek || 0}
          icon={CalendarDays}
          description="Consultas desta semana"
        />
        
        <StatCard
          title="Este Mês"
          value={stats?.consultationsThisMonth || 0}
          icon={Calendar}
          description="Consultas deste mês"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Consultas por CPF"
          value={stats?.consultationsByCpf || 0}
          icon={Users}
          description="Buscas realizadas por CPF"
        />
        
        <StatCard
          title="Consultas por Benefício"
          value={stats?.consultationsByBenefit || 0}
          icon={BarChart3}
          description="Buscas por número do benefício"
        />
        
        <StatCard
          title="Clientes Favoritos"
          value={stats?.favoriteClients || 0}
          icon={Star}
          description="Clientes salvos nos favoritos"
        />
        
        <StatCard
          title="Empréstimos Bloqueados"
          value={stats?.blockedLoansCount || 0}
          icon={XCircle}
          description="Benefícios com empréstimo bloqueado"
        />
        
        <StatCard
          title="Empréstimos Desbloqueados"
          value={stats?.unblockedLoansCount || 0}
          icon={CheckCircle}
          description="Benefícios com empréstimo liberado"
          color="primary"
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Margem Média Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats?.averageMargin ? formatCurrency(stats.averageMargin) : "R$ 0,00"}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Margem média dos benefícios consultados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consultas hoje</span>
                <Badge variant="outline">{stats?.consultationsToday || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Média diária (mês)</span>
                <Badge variant="outline">
                  {stats?.consultationsThisMonth ? Math.round(stats.consultationsThisMonth / 30) : 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notificações</span>
                <Badge variant={unreadCount && unreadCount.count > 0 ? "destructive" : "outline"}>
                  {unreadCount?.count || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users (Admin/Manager only) */}
      {canViewGlobalStats && stats?.topUsers && stats.topUsers.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topUsers.slice(0, 5).map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.username
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {user.consultationCount} consultas
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.consultationsThisMonth || 0}
              </div>
              <p className="text-sm text-muted-foreground">Consultas este mês</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.favoriteClients || 0}
              </div>
              <p className="text-sm text-muted-foreground">Clientes favoritos</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats?.blockedLoansCount || 0}
              </div>
              <p className="text-sm text-muted-foreground">Empréstimos bloqueados</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}