import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Login from "@/pages/login";
import UserManagement from "@/pages/user-management";
import Dashboard from "@/pages/dashboard";
import ConsultationHistory from "@/pages/consultation-history";
import FavoriteClients from "@/pages/favorite-clients";
import Notifications from "@/pages/notifications";
import EmailManagement from "@/pages/EmailManagement";
import ResetPassword from "@/pages/ResetPassword";
import ForgotPassword from "@/pages/ForgotPassword";
import ChangePassword from "@/pages/ChangePassword";
import EditUser from "@/pages/EditUser";
import PasswordExpiryDemo from "@/pages/PasswordExpiryDemo";
import ClientMarkers from "@/pages/client-markers";
import NegotiationsControl from "@/pages/negotiations-control";
import C6Simulation from "@/pages/C6Simulation";
import NotFound from "@/pages/not-found";
import PasswordExpiryAlert from "@/components/PasswordExpiryAlert";

function Router() {
  const { isAuthenticated, isLoading, error, user } = useAuth();

  // Se há erro e não está carregando, assume não autenticado
  if (error && !isLoading) {
    return <Login />;
  }

  // Se está carregando pela primeira vez
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostra login ou páginas públicas
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/change-password" component={ChangePassword} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Verificar se o usuário precisa alterar a senha
  if (user?.mustChangePassword) {
    return (
      <ChangePassword 
        isRequired={true} 
        onSuccess={() => {
          // Atualizar o estado do usuário para remover a flag mustChangePassword
          window.location.reload();
        }}
      />
    );
  }

  // Se está autenticado, mostra o app principal
  return (
    <div className="relative">
      <ThemeToggle />
      {/* Alerta de expiração de senha */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <PasswordExpiryAlert passwordExpiresAt={user?.passwordExpiresAt} />
      </div>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/historico" component={ConsultationHistory} />
        <Route path="/favoritos" component={FavoriteClients} />
        <Route path="/notificacoes" component={Notifications} />
        <Route path="/usuarios" component={UserManagement} />
        <Route path="/user-management" component={UserManagement} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/usuarios/:id/editar" component={EditUser} />
        <Route path="/user/:id/editar" component={EditUser} />
        <Route path="/admin/emails" component={EmailManagement} />
        <Route path="/usuarios/emails" component={EmailManagement} />
        <Route path="/marcacoes" component={ClientMarkers} />
        <Route path="/admin/marcacoes" component={ClientMarkers} />
        <Route path="/negotiations-control" component={NegotiationsControl} />
        <Route path="/admin/negotiations" component={NegotiationsControl} />
        <Route path="/c6-simulation" component={C6Simulation} />
        <Route path="/simulacao-c6" component={C6Simulation} />
        <Route path="/change-password" component={ChangePassword} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="rmj-consultas-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
