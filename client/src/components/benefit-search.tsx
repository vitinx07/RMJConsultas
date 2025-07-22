import { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Utilitários para formatação de CPF
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf);
  const padded = cleaned.padStart(11, '0');
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

interface BenefitSearchProps {
  onSearch: (apiKey: string, searchType: 'cpf' | 'beneficio', searchValue: string) => void;
  isLoading: boolean;
}

export function BenefitSearch({ onSearch, isLoading }: BenefitSearchProps) {
  const apiKey = '4630e3b1ad52c0397c64c81e5a3fb8ec'; // API key fixa para o sistema
  const [searchType, setSearchType] = useState<'cpf' | 'beneficio'>('cpf');
  const [searchValue, setSearchValue] = useState('');
  const [cpfError, setCpfError] = useState('');
  const { toast } = useToast();

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    setCpfError(''); // Limpar erro quando usuário digita
  };

  const handleCPFBlur = () => {
    if (searchType === 'cpf' && searchValue) {
      const cleaned = cleanCPF(searchValue);
      if (cleaned.length > 0) {
        // Formatar CPF quando sair do campo
        const formatted = formatCPF(cleaned);
        setSearchValue(formatted);
        
        // Validar CPF
        if (cleaned.length === 11) {
          if (!isValidCPF(cleaned)) {
            setCpfError('CPF inválido');
          } else {
            setCpfError('');
          }
        } else if (cleaned.length > 0) {
          setCpfError('CPF deve ter 11 dígitos');
        }
      }
    }
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o campo de busca.",
        variant: "destructive",
      });
      return;
    }

    // Validar CPF se for busca por CPF
    if (searchType === 'cpf') {
      const cleaned = cleanCPF(searchValue);
      if (cleaned.length !== 11 || !isValidCPF(cleaned)) {
        toast({
          title: "CPF Inválido",
          description: "Por favor, digite um CPF válido com 11 dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    // Enviar CPF limpo ou valor do benefício
    const finalValue = searchType === 'cpf' ? cleanCPF(searchValue) : searchValue;
    onSearch(apiKey, searchType, finalValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Consulta de Benefícios
          </CardTitle>
          <CardDescription>
            Selecione o tipo de busca e informe os dados para consultar os benefícios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search Type Toggle */}
            <div>
              <Label className="text-base font-medium">Tipo de Consulta</Label>
              <RadioGroup 
                value={searchType} 
                onValueChange={(value) => setSearchType(value as 'cpf' | 'beneficio')}
                className="flex flex-col sm:flex-row gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cpf" id="cpf" />
                  <Label htmlFor="cpf">Consultar por CPF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beneficio" id="beneficio" />
                  <Label htmlFor="beneficio">Consultar por Número do Benefício</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Search Input */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="searchInput">
                  {searchType === 'cpf' ? 'CPF' : 'Número do Benefício'}
                </Label>
                <Input
                  id="searchInput"
                  type="text"
                  placeholder={searchType === 'cpf' ? 'Digite o CPF' : 'Digite o número do benefício'}
                  value={searchValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={handleCPFBlur}
                  onKeyPress={handleKeyPress}
                  className={`mt-2 ${cpfError ? 'border-red-500' : ''}`}
                />
                {searchType === 'cpf' && cpfError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{cpfError}</AlertDescription>
                  </Alert>
                )}
                {searchType === 'cpf' && searchValue && !cpfError && cleanCPF(searchValue).length === 11 && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <span className="text-green-500">✓</span> CPF válido
                  </p>
                )}
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Search className="h-4 w-4" />
                {isLoading ? 'Consultando...' : 'Consultar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
