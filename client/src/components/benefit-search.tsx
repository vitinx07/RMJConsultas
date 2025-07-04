import { useState } from "react";
import { Search, Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface BenefitSearchProps {
  onSearch: (apiKey: string, searchType: 'cpf' | 'beneficio', searchValue: string) => void;
  isLoading: boolean;
}

export function BenefitSearch({ onSearch, isLoading }: BenefitSearchProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('multicorban_api_key') || '');
  const [searchType, setSearchType] = useState<'cpf' | 'beneficio'>('cpf');
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('multicorban_api_key', apiKey);
      toast({
        title: "API Key salva",
        description: "Sua chave de API foi salva com sucesso no navegador.",
      });
    }
  };

  const handleSearch = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, configure sua chave de API.",
        variant: "destructive",
      });
      return;
    }

    if (!searchValue.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o campo de busca.",
        variant: "destructive",
      });
      return;
    }

    onSearch(apiKey, searchType, searchValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-8">
      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Configuração da API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="apiKey">Chave de API</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Digite sua chave de API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleSaveApiKey}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
          <Alert className="mt-4">
            <AlertDescription>
              <Key className="h-4 w-4 inline mr-1" />
              Sua chave será salva no navegador para uso futuro
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="mt-2"
                />
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
