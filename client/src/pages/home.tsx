import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { University, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { BenefitSearch } from "@/components/benefit-search";
import { BenefitCard } from "@/components/benefit-card";
import { BenefitDetails } from "@/components/benefit-details";
import { searchBenefits, getBenefitDetails, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Benefit } from "@shared/schema";

export default function Home() {
  const [searchParams, setSearchParams] = useState<{
    apiKey: string;
    searchType: 'cpf' | 'beneficio';
    searchValue: string;
  } | null>(null);
  
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
      toast({
        title: "Erro na API",
        description: error.message,
        variant: "destructive",
      });
    } else if (error instanceof Error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (searchError) {
    handleError(searchError);
  }

  if (detailsError) {
    handleError(detailsError);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <University className="h-8 w-8" />
              <h1 className="text-2xl font-bold">MULTI CORBAN</h1>
            </div>
            <div className="text-sm opacity-90">
              <span>Consulta de Benefícios INSS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <BenefitSearch 
          onSearch={handleSearch} 
          isLoading={isSearching} 
        />

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
        {benefits && benefits.length > 0 && (
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
            {isLoadingDetails ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-muted-foreground">Carregando detalhes do benefício...</span>
                </CardContent>
              </Card>
            ) : benefitDetails ? (
              <BenefitDetails benefit={benefitDetails} />
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm opacity-75">
              © 2024 MULTI CORBAN - Sistema de Consulta de Benefícios INSS
            </p>
            <p className="text-xs opacity-50 mt-2">
              Desenvolvido para correspondentes bancários
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
