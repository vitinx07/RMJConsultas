import React, { useState, useEffect } from 'react';
import { X, Calculator, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SafraSimulationProps {
  isOpen: boolean;
  onClose: () => void;
  contratos: any[];
  beneficiaryData: any;
}

interface SimulationResult {
  prazo: number;
  valorTroco: number;
  valorParcela?: number;
  taxaJuros?: number;
  valorTotal?: number;
}

export function SafraSimulation({ isOpen, onClose, contratos, beneficiaryData }: SafraSimulationProps) {
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [idConvenio, setIdConvenio] = useState<number | null>(null);
  const { toast } = useToast();

  // Filtra apenas contratos do Safra (código 422)
  const safraContracts = contratos.filter(c => c.Banco === '422');

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setSelectedContracts([]);
      setSimulationResults([]);
      setError(null);
      setSelectedOption('');
      setToken(null);
      setIdConvenio(null);
    }
  }, [isOpen]);

  const handleContractToggle = (contractId: string) => {
    setSelectedContracts(prev => {
      if (prev.includes(contractId)) {
        return prev.filter(id => id !== contractId);
      }
      
      // Validar se todos os contratos selecionados são da mesma matrícula
      const newContract = safraContracts.find(c => c.Contrato === contractId);
      const existingContract = safraContracts.find(c => prev.includes(c.Contrato));
      
      if (existingContract && newContract.Beneficio !== existingContract.Beneficio) {
        toast({
          title: "Erro na Seleção",
          description: "Você só pode simular contratos da mesma matrícula",
          variant: "destructive",
        });
        return prev;
      }
      
      return [...prev, contractId];
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0] + 'T00:00:00';
    } catch {
      return '';
    }
  };

  const mapSituacaoBeneficio = (situacao: string): number => {
    const mapeamento: { [key: string]: number } = {
      "ATIVO": 1,
      "INATIVO": 2,
      "PENSIONISTA": 3
    };
    return mapeamento[situacao?.toUpperCase()] || 1;
  };

  const authenticateSafra = async () => {
    try {
      const response = await fetch('/api/safra/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  };

  const getConvenioId = async (token: string) => {
    try {
      const response = await fetch('/api/safra/convenio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar convênio');
      }

      const data = await response.json();
      return data.idConvenio;
    } catch (error) {
      console.error('Erro ao buscar convênio:', error);
      throw error;
    }
  };

  const handleSimulate = async () => {
    if (selectedContracts.length === 0) {
      toast({
        title: "Nenhum contrato selecionado",
        description: "Selecione pelo menos um contrato para simular",
        variant: "destructive",
      });
      return;
    }

    setIsSimulating(true);
    setError(null);

    try {
      // 1. Autenticar
      let authToken = token;
      if (!authToken) {
        authToken = await authenticateSafra();
        setToken(authToken);
      }

      // 2. Buscar ID do convênio
      let convenioId = idConvenio;
      if (!convenioId && authToken) {
        convenioId = await getConvenioId(authToken);
        setIdConvenio(convenioId);
      }

      // 3. Preparar payload para simulação
      const selectedContractData = safraContracts.filter(c => selectedContracts.includes(c.Contrato));
      const refins = selectedContractData.map(c => ({
        idContrato: parseInt(c.Contrato)
      }));

      const payload = {
        idConvenio: convenioId,
        cpf: parseInt(beneficiaryData.CPF.replace(/\D/g, '')),
        matricula: beneficiaryData.Beneficio,
        isCotacao: true,
        refins: refins,
        prazos: [84, 96], // Simula para os prazos 84 e 96
        dtNascimento: formatDate(beneficiaryData.DataNascimento),
        idSexo: beneficiaryData.Sexo || "N/A",
        idSituacaoEmpregado: mapSituacaoBeneficio(beneficiaryData.Situacao),
        idUF: beneficiaryData.UF || "SP",
        comSeguro: false,
        valorRenda: 0,
        valorDescontos: 0,
        valorMargemAdicional: 0,
        valorTroco: 0,
        idCorban: 0,
        idCorbansubs: 0,
        idComercial: 0,
        prazo: 0,
        valorParcela: 0,
        valorPrincipal: 0,
        tarifaCadastro: 0,
        taxaJuros: 0,
        idTabelaJuros: 0,
        idSeguro: 0,
        comissao: 0,
        idServicos: [],
        dataAdmissao: "2020-01-01T00:00:00"
      };

      // 4. Fazer simulação
      const response = await fetch('/api/safra/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: authToken, payload })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.criticas) {
          throw new Error(data.criticas[0] || data.error);
        }
        throw new Error(data.error || 'Erro na simulação');
      }

      // 5. Processar resultados
      if (data.simulacoes && data.simulacoes.length > 0) {
        setSimulationResults(data.simulacoes);
        toast({
          title: "Simulação realizada",
          description: `${data.simulacoes.length} opções encontradas`,
        });
      } else {
        throw new Error("Nenhuma simulação retornada");
      }

    } catch (error: any) {
      console.error('Erro na simulação:', error);
      setError(error.message || 'Erro ao realizar simulação');
      toast({
        title: "Erro na simulação",
        description: error.message || 'Não foi possível realizar a simulação',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Simulação Banco Safra</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Nome:</span> {beneficiaryData.Nome}
              </div>
              <div>
                <span className="font-medium">CPF:</span> {beneficiaryData.CPF}
              </div>
              <div>
                <span className="font-medium">Benefício:</span> {beneficiaryData.Beneficio}
              </div>
              <div>
                <span className="font-medium">Situação:</span> {beneficiaryData.Situacao}
              </div>
            </div>
          </div>

          {/* Seleção de Contratos */}
          <div>
            <h3 className="font-semibold mb-3">Selecione os contratos para simulação</h3>
            {safraContracts.length === 0 ? (
              <p className="text-gray-500">Nenhum contrato do Banco Safra encontrado</p>
            ) : (
              <div className="space-y-2">
                {safraContracts.map((contrato) => (
                  <div key={contrato.Contrato} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Checkbox
                      id={contrato.Contrato}
                      checked={selectedContracts.includes(contrato.Contrato)}
                      onCheckedChange={() => handleContractToggle(contrato.Contrato)}
                    />
                    <Label htmlFor={contrato.Contrato} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Contrato: {contrato.Contrato}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({contrato.ParcelasPagas || '0'} parcelas pagas)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(contrato.ValorParcela)}</div>
                          <div className="text-sm text-gray-500">Prazo: {contrato.Prazo} meses</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão de Simulação */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSimulate}
              disabled={selectedContracts.length === 0 || isSimulating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Simular Refinanciamento
                </>
              )}
            </Button>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">Erro na simulação</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resultados */}
          {simulationResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Opções de Refinanciamento</h3>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {simulationResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value={`option-${index}`} id={`option-${index}`} className="sr-only" />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">Prazo: {result.prazo} meses</Badge>
                            <Badge variant="default" className="bg-green-600">
                              Troco: {formatCurrency(result.valorTroco)}
                            </Badge>
                          </div>
                          {result.valorParcela && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Parcela: {formatCurrency(result.valorParcela)}
                            </div>
                          )}
                          {result.taxaJuros && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Taxa: {result.taxaJuros}% a.m.
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {selectedOption === `option-${index}` && (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {selectedOption && (
                <div className="flex justify-end">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      toast({
                        title: "Opção selecionada",
                        description: "Continue com o processo de refinanciamento",
                      });
                      onClose();
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Prosseguir com Refinanciamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}