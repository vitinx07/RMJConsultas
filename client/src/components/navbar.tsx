import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { University, LogOut, Users, User, Shield, ShieldCheck, BarChart3, History, Star, Bell, Menu, X } from "lucide-react";

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

export function Navbar() {
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
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Não foi possível realizar o logout",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <nav className="bg-primary text-primary-foreground shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <University className="h-7 w-7" />
                <div>
                  <h1 className="text-lg font-bold">MULTI CORBAN</h1>
                  <p className="text-xs opacity-90">Consulta de Benefícios INSS</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
                
                {/* Theme Toggle integrated into navigation */}
                <div className="mx-2">
                  <ThemeToggle />
                </div>
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

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
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
      </nav>
    </>
  );
}