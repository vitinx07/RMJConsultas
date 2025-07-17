import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { University, AlertCircle, Loader2 } from "lucide-react";
import logoPath from "@assets/rmj_1751973121690.jpeg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { BenefitSearch } from "@/components/benefit-search";
import { BenefitCard } from "@/components/benefit-card";
import { BenefitDetails } from "@/components/benefit-details";
import { ErrorDisplay } from "@/components/error-display";
import { searchBenefits, getBenefitDetails, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Benefit } from "@shared/schema";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const [searchParams, setSearchParams] = useState<{
    apiKey: string;
    searchType: 'cpf' | 'beneficio';
    searchValue: string;
  } | null>(null);
  
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sucesso",
        description: "Logout realizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  // Search benefits query
  const { 
    data: benefits, 
    isLoading: isSearching, 
    error: searchError,
    refetch 
  } = useQuery({
    queryKey: ['benefits', searchParams],
    queryFn: () => searchBenefits(searchParams!),
    enabled: !!searchParams,
    retry: false,
    staleTime: 30000, // 30 seconds
  });

  // Get benefit details query
  const { 
    data: benefitDetails, 
    isLoading: isLoadingDetails, 
    error: detailsError 
  } = useQuery({
    queryKey: ['benefit-details', selectedBenefit, searchParams?.apiKey],
    queryFn: () => getBenefitDetails(searchParams!.apiKey, selectedBenefit!),
    enabled: !!selectedBenefit && !!searchParams?.apiKey,
    retry: false,
    staleTime: 60000, // 1 minute
  });
  const handleSearch = (apiKey: string, searchType: 'cpf' | 'beneficio', searchValue: string) => {
    setSearchParams({ apiKey, searchType, searchValue });
    setSelectedBenefit(null);
  };

  const handleViewDetails = (benefitNumber: string) => {
    setSelectedBenefit(benefitNumber);
  };

  // Note: Error handling is now done directly in the UI components

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <BenefitSearch 
          onSearch={handleSearch} 
          isLoading={isSearching} 
        />

        {/* Search Error Display */}
        {searchError && (
          <div className="mt-8">
            <ErrorDisplay 
              error={searchError} 
              onRetry={() => refetch()} 
            />
          </div>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <Card className="mt-8">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Consultando dados...</span>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {benefits && benefits.length > 0 && !searchError && (
          <Alert className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {benefits.length} benefício(s) encontrado(s) para a consulta realizada.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits Results */}
        {benefits && benefits.length > 0 && (
          <div className="mt-8">
            <div className="grid gap-6 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <BenefitCard
                  key={`${benefit.Beneficiario.Beneficio}-${index}`}
                  benefit={benefit}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* Benefit Details */}
        {selectedBenefit && (
          <div className="mt-8">
            {detailsError && (
              <div className="mb-4">
                <ErrorDisplay 
                  error={detailsError} 
                  onRetry={() => window.location.reload()} 
                />
              </div>
            )}
            {isLoadingDetails ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-muted-foreground">Carregando detalhes do benefício...</span>
                </CardContent>
              </Card>
            ) : benefitDetails && !detailsError ? (
              <BenefitDetails benefit={benefitDetails} />
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 dark:bg-muted/20 text-muted-foreground mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm opacity-75">
              © 2025 RMJ Consultas - Sistema de Consulta de Benefícios INSS
            </p>
            <p className="text-xs opacity-50 mt-2">
              Desenvolvido por Vitor Cavalcanti
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}