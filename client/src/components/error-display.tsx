import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

interface ErrorDisplayProps {
  error: Error | ApiError;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className = "" }: ErrorDisplayProps) {
  const isApiError = error instanceof ApiError;
  
  const getErrorIcon = (status?: number) => {
    if (!status) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    
    if (status >= 500) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    } else if (status >= 400) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-destructive" />;
  };

  const getErrorColor = (status?: number) => {
    if (!status) return "border-destructive";
    
    if (status >= 500) {
      return "border-orange-500";
    } else if (status >= 400) {
      return "border-red-500";
    }
    return "border-destructive";
  };

  return (
    <Card className={`${getErrorColor(isApiError ? error.status : undefined)} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {getErrorIcon(isApiError ? error.status : undefined)}
          <span>
            {isApiError ? error.title : "Erro na Aplicação"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Descrição:
          </p>
          <p className="text-sm">{error.message}</p>
        </div>
        
        {isApiError && error.details && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Detalhes Técnicos:
            </p>
            <div className="bg-muted p-3 rounded text-xs font-mono break-words">
              {error.details}
            </div>
          </div>
        )}
        
        {isApiError && error.status && (
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Código HTTP: {error.status}</span>
            <span>Timestamp: {new Date().toLocaleString('pt-BR')}</span>
          </div>
        )}
        
        {onRetry && (
          <div className="flex justify-end pt-2">
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}