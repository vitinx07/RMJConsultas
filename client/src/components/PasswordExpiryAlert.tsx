import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Key } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface PasswordExpiryAlertProps {
  passwordExpiresAt?: Date | string | null;
  className?: string;
}

export function PasswordExpiryAlert({ passwordExpiresAt, className }: PasswordExpiryAlertProps) {
  const [, navigate] = useLocation();

  // Query para buscar status de expiração em tempo real
  const { data: passwordStatus } = useQuery({
    queryKey: ['/api/auth/password-status'],
    refetchInterval: 30000, // Verifica a cada 30 segundos
    retry: false,
    meta: { skipErrorToast: true }
  });

  // Usar dados do servidor se disponível, senão usar props
  const expiryData = passwordStatus || { 
    passwordExpiresAt, 
    daysUntilExpiry: passwordExpiresAt ? Math.ceil((new Date(passwordExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : -1,
    shouldShowWarning: false,
    warningMessage: "",
    mustChangePassword: false
  };

  if (!expiryData.passwordExpiresAt && !expiryData.mustChangePassword) return null;

  const daysUntilExpiry = expiryData.daysUntilExpiry;

  // Mostrar sempre se mustChangePassword for true, ou se expiração está próxima
  if (!expiryData.mustChangePassword && (daysUntilExpiry > 3 || daysUntilExpiry < 0)) return null;

  const getAlertConfig = () => {
    // Senha temporária - deve ser alterada
    if (expiryData.mustChangePassword) {
      return {
        variant: "destructive" as const,
        icon: <Key className="h-4 w-4" />,
        title: "Alteração de Senha Obrigatória",
        message: "Você está usando uma senha temporária e deve alterá-la para continuar.",
        urgent: true
      };
    }
    
    if (daysUntilExpiry === 0) {
      return {
        variant: "destructive" as const,
        icon: <Key className="h-4 w-4" />,
        title: "Senha Expirada!",
        message: "Sua senha expirou hoje. Altere sua senha imediatamente para continuar usando o sistema.",
        urgent: true
      };
    } else if (daysUntilExpiry === 1) {
      return {
        variant: "destructive" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: "Senha Expira Amanhã!",
        message: "Sua senha expirará amanhã. Altere sua senha agora para evitar bloqueio do acesso.",
        urgent: true
      };
    } else if (daysUntilExpiry === 2) {
      return {
        variant: "destructive" as const,
        icon: <Clock className="h-4 w-4" />,
        title: "Senha Expira em 2 Dias",
        message: "Sua senha expirará em 2 dias. Altere sua senha urgentemente!",
        urgent: false
      };
    } else if (daysUntilExpiry === 3) {
      return {
        variant: "default" as const,
        icon: <Clock className="h-4 w-4" />,
        title: "Senha Expira em 3 Dias",
        message: "Sua senha expirará em 3 dias. Considere alterar sua senha para continuar usando o sistema.",
        urgent: false
      };
    }
    
    return null;
  };

  const config = getAlertConfig();
  if (!config) return null;

  return (
    <Alert 
      variant={config.variant} 
      className={`mb-4 border-l-4 ${config.urgent ? 'animate-pulse' : ''} ${className}`}
    >
      {config.icon}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{config.title}</h4>
          <AlertDescription className="text-sm">
            {config.message}
          </AlertDescription>
        </div>
        <Button 
          onClick={() => navigate('/change-password')}
          size="sm"
          variant={config.urgent ? "secondary" : "outline"}
          className="ml-4 shrink-0"
        >
          Alterar Senha
        </Button>
      </div>
    </Alert>
  );
}

export default PasswordExpiryAlert;