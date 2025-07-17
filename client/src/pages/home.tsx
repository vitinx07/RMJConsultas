import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { University, AlertCircle, Loader2, LogOut, Users, User, Shield, ShieldCheck, BarChart3, History, Star, Bell, Menu, X } from "lucide-react";
import logoPath from "@assets/rmj_1751973121690.jpeg";
import { ThemeToggle } from "@/components/theme-toggle";
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

export default function Home() {
  const [searchParams, setSearchParams] = useState<{
    apiKey: string;
    searchType: 'cpf' | 'beneficio';
    searchValue: string;
  } | null>(null);
  
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // Function to get active button styles
  const getNavButtonClass = (path: string) => {
    const isActive = location === path;
    return isActive 
      ? "text-primary-foreground bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
      : "text-primary-foreground hover:bg-primary-foreground/20 transition-colors";
  };

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
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={logoPath} 
                alt="RMJ Logo" 
                className="h-10 w-10 object-cover rounded-full border-2 border-primary-foreground/20"
              />
              <div>
                <h1 className="text-2xl font-bold">RMJ CONSULTAS</h1>
                <p className="text-sm opacity-90">Consulta de Benefícios INSS</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Desktop Navigation */}
                  <nav className="hidden lg:flex items-center space-x-1">
                    <Link href="/">
                      <Button variant="ghost" size="sm" className={getNavButtonClass("/")}>
                        <University className="h-4 w-4 mr-2" />
                        Consultas
                      </Button>
                    </Link>
                    
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm" className={getNavButtonClass("/dashboard")}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    
                    <Link href="/historico">
                      <Button variant="ghost" size="sm" className={getNavButtonClass("/historico")}>
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </Button>
                    </Link>
                    
                    <Link href="/favoritos">
                      <Button variant="ghost" size="sm" className={getNavButtonClass("/favoritos")}>
                        <Star className="h-4 w-4 mr-2" />
                        Favoritos
                      </Button>
                    </Link>
                    
                    <Link href="/notificacoes">
                      <Button variant="ghost" size="sm" className={getNavButtonClass("/notificacoes")}>
                        <Bell className="h-4 w-4 mr-2" />
                        Notificações
                      </Button>
                    </Link>
                    
                    {user.role === "administrator" && (
                      <Link href="/usuarios">
                        <Button variant="ghost" size="sm" className={getNavButtonClass("/usuarios")}>
                          <Users className="h-4 w-4 mr-2" />
                          Usuários
                        </Button>
                      </Link>
                    )}
                  </nav>

                  {/* User Info and Actions */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right hidden md:block">
                      <p className="font-semibold text-sm">
                        {user.firstName || user.username}
                      </p>
                      <div className="flex items-center justify-end space-x-1">
                        {(() => {
                          const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;
                          return <RoleIcon className="h-3 w-3" />;
                        })()}
                        <span className="text-xs opacity-80">
                          {roleLabels[user.role as keyof typeof roleLabels] || "Usuário"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <ThemeToggle />
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-primary bg-primary-foreground hover:bg-primary-foreground/90 hidden md:flex transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isLoggingOut ? "Saindo..." : "Sair"}
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Menu Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="lg:hidden text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && user && (
          <div className="lg:hidden border-t border-primary-foreground/20 bg-primary/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-2">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${getNavButtonClass("/")}`}>
                    <University className="h-4 w-4 mr-3" />
                    Consultas
                  </Button>
                </Link>
                
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${getNavButtonClass("/dashboard")}`}>
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Dashboard
                  </Button>
                </Link>
                
                <Link href="/historico" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${getNavButtonClass("/historico")}`}>
                    <History className="h-4 w-4 mr-3" />
                    Histórico
                  </Button>
                </Link>
                
                <Link href="/favoritos" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${getNavButtonClass("/favoritos")}`}>
                    <Star className="h-4 w-4 mr-3" />
                    Favoritos
                  </Button>
                </Link>
                
                <Link href="/notificacoes" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${getNavButtonClass("/notificacoes")}`}>
                    <Bell className="h-4 w-4 mr-3" />
                    Notificações
                  </Button>
                </Link>
                
                {user.role === "administrator" && (
                  <Link href="/usuarios" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className={`w-full justify-start ${getNavButtonClass("/usuarios")}`}>
                      <Users className="h-4 w-4 mr-3" />
                      Usuários
                    </Button>
                  </Link>
                )}
                
                <div className="pt-4 mt-4 border-t border-primary-foreground/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <p className="font-semibold">{user.firstName || user.username}</p>
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;
                          return <RoleIcon className="h-3 w-3" />;
                        })()}
                        <span className="text-xs opacity-80">
                          {roleLabels[user.role as keyof typeof roleLabels] || "Usuário"}
                        </span>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoggingOut}
                    className="w-full justify-start text-primary bg-primary-foreground hover:bg-primary-foreground/90 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {isLoggingOut ? "Saindo..." : "Sair"}
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

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