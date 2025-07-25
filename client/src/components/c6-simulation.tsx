import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Calculator, FileText, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface C6Contract {
  contrato: string;
  dataContrato: string;
  valorParcela: number;
  refinanciavel: boolean;
  saldoDevedor: number;
  quantidadeParcelas: number;
  convenio: string;
}

interface SimulationResult {
  prazo: string;
  valorAF: number;
  valorParcela: number;
  valorTotal: number;
  taxa: number;
  plano: string;
}

interface DigitizationRequest {
  cpf: string;
  nomeCompleto: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  rendaLiquida: number;
  valorDesejado: number;
  prazoDesejado: string;
  contratos: string[];
}

interface DigitizationResult {
  success: boolean;
  protocoloId: string;
  linkFormalizacao?: string;
  status: 'aprovado' | 'reprovado' | 'pendente';
  observacoes?: string;
}

interface C6SimulationProps {
  cpf: string;
  dataNascimento: string;
  className?: string;
}

interface BenefitData {
  Beneficiario: {
    Nome: string;
    CPF: string;
    DataNascimento: string;
    Beneficio: string;
    NomeMae: string;
    RG: string;
    CEP: string;
    Telefone: string;
    Email: string;
    Logradouro: string;
    Numero: string;
    Complemento: string;
    Bairro: string;
    Cidade: string;
    UF: string;
  };
  ResumoFinanceiro: {
    ValorBeneficio: string;
  };
  DadosBancarios: {
    Banco: string;
    AgenciaPagto: string;
    ContaPagto: string;
  };
  Emprestimos: Array<{
    Contrato: string;
    Banco: string;
    ValorParcela: number;
  }>;
}

interface CreditCondition {
  covenant: { code: string; description: string };
  product: { code: string; description: string };
  client_amount: number;
  installment_amount: number;
  installment_quantity: number;
  interest_rate: number;
  total_amount: number;
  expenses?: Array<{
    description_type: string;
    amount: number;
    exempt: string;
  }>;
}

export function C6Simulation({ 
  cpf, 
  dataNascimento,
  className = ""
}: C6SimulationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'simulation' | 'digitization'>('simulation');
  const [prazoDesejado, setPrazoDesejado] = useState("84");
  const [benefitData, setBenefitData] = useState<BenefitData | null>(null);
  const [contracts, setContracts] = useState<C6Contract[]>([]);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [creditConditions, setCreditConditions] = useState<CreditCondition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<CreditCondition | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<number>(-1);
  
  // Dados para digitalização (pré-preenchidos)
  const [digitizationData, setDigitizationData] = useState({
    // Dados pessoais
    nomeCompleto: '',
    nomeMae: '',
    rg: '',
    telefone: '',
    email: '',
    
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    
    // Dados bancários
    banco: '',
    agencia: '',
    conta: '',
    
    // Dados do benefício
    beneficio: '',
    rendaBruta: '',
    
    // Configurações do empréstimo
    prazoDesejado: '84',
    parcelaAtual: 0
  });
  
  const [proposalNumber, setProposalNumber] = useState<string>('');
  const [formalizationStatus, setFormalizationStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [formalizationUrl, setFormalizationUrl] = useState<string>('');
  const [formalizationAttempts, setFormalizationAttempts] = useState(0);
  const { toast } = useToast();

  // Buscar dados completos do CPF (MULTI CORBAN)
  const fetchBenefitData = useMutation({
    mutationFn: async (cpf: string) => {
      const response = await fetch('/api/multicorban/cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do beneficiário');
      }

      const data = await response.json();
      return data[0]; // Primeiro benefício
    },
    onSuccess: (data) => {
      setBenefitData(data);
      
      // Pré-preencher dados de digitalização
      const beneficiario = data.Beneficiario;
      const bancarios = data.DadosBancarios;
      const resumo = data.ResumoFinanceiro;
      
      setDigitizationData({
        nomeCompleto: beneficiario.Nome || '',
        nomeMae: beneficiario.NomeMae || '',
        rg: beneficiario.RG || '',
        telefone: beneficiario.Telefone || '',
        email: beneficiario.Email || '',
        cep: beneficiario.CEP || '',
        logradouro: beneficiario.Logradouro || '',
        numero: beneficiario.Numero || '',
        complemento: beneficiario.Complemento || '',
        bairro: beneficiario.Bairro || '',
        cidade: beneficiario.Cidade || '',
        uf: beneficiario.UF || '',
        banco: bancarios.Banco || '',
        agencia: bancarios.AgenciaPagto || '',
        conta: bancarios.ContaPagto || '',
        beneficio: beneficiario.Beneficio || '',
        rendaBruta: resumo.ValorBeneficio || '',
        prazoDesejado,
        parcelaAtual: 0
      });

      // Filtrar contratos C6 Bank
      const c6Contracts = data.Emprestimos?.filter((emp: any) => 
        emp.Banco === '626' || emp.NomeBanco?.toLowerCase().includes('ficsa')
      ) || [];
      
      setContracts(c6Contracts.map((emp: any) => ({
        contrato: emp.Contrato,
        dataContrato: emp.DataAverbacao,
        valorParcela: emp.ValorParcela,
        refinanciavel: true,
        saldoDevedor: emp.SaldoDevedor || 0,
        quantidadeParcelas: emp.PrazoRestante || 84,
        convenio: 'INSS'
      })));
    },
    onError: (error) => {
      toast({
        title: "Erro ao buscar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Simulação C6
  const simulationMutation = useMutation({
    mutationFn: async (params: {
      cpf: string;
      dataNascimento: string;
      valorDesejado: number;
      prazoDesejado: string;
      contratos: string[];
    }) => {
      const response = await fetch('/api/c6/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: 'Erro na simulação' 
        }));
        throw new Error(errorData.error || 'Erro na simulação');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSimulationResults(data);
      toast({
        title: "Simulação realizada",
        description: `${data.length} opção(ões) de refinanciamento encontrada(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na simulação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Digitalização de proposta
  const digitizationMutation = useMutation({
    mutationFn: async (data: DigitizationRequest) => {
      const response = await fetch('/api/c6/digitize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: 'Erro na digitalização' 
        }));
        throw new Error(errorData.error || 'Erro na digitalização');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setDigitizationResult(data);
      if (data.success) {
        toast({
          title: "Proposta digitalizada",
          description: `Protocolo: ${data.protocoloId}`,
        });
        // Iniciar tentativas de formalização se aprovado
        if (data.status === 'aprovado' && data.linkFormalizacao) {
          startFormalizationLoop(data.protocoloId);
        }
      } else {
        toast({
          title: "Proposta reprovada",
          description: data.observacoes || "Proposta não aprovada pelo sistema.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na digitalização",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Loop de tentativas de formalização
  const startFormalizationLoop = (protocoloId: string) => {
    let attempts = 0;
    const maxAttempts = 15;
    const interval = 20000; // 20 segundos

    const checkFormalization = async () => {
      attempts++;
      setFormalizationAttempts(attempts);

      try {
        const response = await fetch(`/api/c6/formalization-status/${protocoloId}`);
        const data = await response.json();

        if (data.linkFormalizacao) {
          toast({
            title: "Link de formalização disponível",
            description: "Você pode agora finalizar o processo.",
          });
          setDigitizationResult(prev => prev ? { ...prev, linkFormalizacao: data.linkFormalizacao } : null);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(checkFormalization, interval);
        } else {
          toast({
            title: "Timeout na formalização",
            description: "Máximo de tentativas atingido.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao verificar formalização:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkFormalization, interval);
        }
      }
    };

    checkFormalization();
  };

  const handleContractSelection = (contractId: string, selected: boolean) => {
    if (selected) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  };

  const handleSimulation = () => {
    if (!valorDesejado || selectedContracts.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione contratos e informe o valor desejado.",
        variant: "destructive",
      });
      return;
    }

    simulationMutation.mutate({
      cpf,
      dataNascimento,
      valorDesejado: parseFloat(valorDesejado),
      prazoDesejado,
      contratos: selectedContracts
    });
  };

  const handleDigitization = () => {
    const requiredFields = ['nomeCompleto', 'telefone', 'email', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf', 'rendaLiquida'];
    const missingFields = requiredFields.filter(field => !digitizationData[field as keyof typeof digitizationData]);

    if (missingFields.length > 0 || selectedContracts.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios e selecione contratos.",
        variant: "destructive",
      });
      return;
    }

    const request: DigitizationRequest = {
      cpf,
      nomeCompleto: digitizationData.nomeCompleto,
      dataNascimento,
      telefone: digitizationData.telefone,
      email: digitizationData.email,
      endereco: {
        cep: digitizationData.cep,
        logradouro: digitizationData.logradouro,
        numero: digitizationData.numero,
        complemento: digitizationData.complemento,
        bairro: digitizationData.bairro,
        cidade: digitizationData.cidade,
        uf: digitizationData.uf,
      },
      rendaLiquida: parseFloat(digitizationData.rendaLiquida),
      valorDesejado: parseFloat(digitizationData.valorDesejado || valorDesejado),
      prazoDesejado: digitizationData.prazoDesejado,
      contratos: selectedContracts
    };

    digitizationMutation.mutate(request);
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    if (contracts.length === 0) {
      contractsMutation.mutate(cpf);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 ${className}`}
          onClick={handleOpenDialog}
        >
          <Building2 className="h-4 w-4 mr-2" />
          C6 Bank
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>C6 Bank - Simulação e Digitalização</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full">
          {/* Custom Tab Navigation */}
          <div className="flex w-full border-b mb-6">
            <button
              onClick={() => setActiveTab("simulation")}
              className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
                activeTab === "simulation"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Simulação</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("digitization")}
              className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
                activeTab === "digitization"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Digitalização</span>
              </div>
            </button>
          </div>

          {/* Simulation Tab */}
          {activeTab === "simulation" && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parâmetros de Simulação */}
              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros da Simulação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Valor Desejado (R$)</Label>
                    <Input
                      type="number"
                      value={valorDesejado}
                      onChange={(e) => setValorDesejado(e.target.value)}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  <div>
                    <Label>Prazo Desejado</Label>
                    <Select value={prazoDesejado} onValueChange={setPrazoDesejado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="36">36 meses</SelectItem>
                        <SelectItem value="48">48 meses</SelectItem>
                        <SelectItem value="60">60 meses</SelectItem>
                        <SelectItem value="72">72 meses</SelectItem>
                        <SelectItem value="84">84 meses</SelectItem>
                        <SelectItem value="96">96 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleSimulation}
                    disabled={simulationMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {simulationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Simular
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Contratos Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Contratos Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  {contractsMutation.isPending ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Carregando contratos...</span>
                    </div>
                  ) : contracts.length > 0 ? (
                    <div className="space-y-2">
                      {contracts.map((contract) => (
                        <label key={contract.contrato} className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedContracts.includes(contract.contrato)}
                            onChange={(e) => handleContractSelection(contract.contrato, e.target.checked)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{contract.contrato}</div>
                            <div className="text-sm text-gray-600">
                              Parcela: R$ {contract.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-gray-600">
                              Saldo: R$ {contract.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {contractsMutation.isError ? "Erro ao carregar contratos" : "Nenhum contrato encontrado"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resultados da Simulação */}
            {simulationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados da Simulação</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor AF (R$)</TableHead>
                        <TableHead>Parcela (R$)</TableHead>
                        <TableHead>Total (R$)</TableHead>
                        <TableHead>Taxa (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulationResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.prazo} meses</TableCell>
                          <TableCell>{result.plano}</TableCell>
                          <TableCell>R$ {result.valorAF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>R$ {result.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{result.taxa.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {/* Digitization Tab */}
          {activeTab === "digitization" && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={digitizationData.nomeCompleto}
                      onChange={(e) => setDigitizationData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={digitizationData.telefone}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={digitizationData.email}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Renda Líquida (R$) *</Label>
                    <Input
                      type="number"
                      value={digitizationData.rendaLiquida}
                      onChange={(e) => setDigitizationData(prev => ({ ...prev, rendaLiquida: e.target.value }))}
                      placeholder="Ex: 5000"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CEP *</Label>
                      <Input
                        value={digitizationData.cep}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, cep: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <Label>UF *</Label>
                      <Input
                        value={digitizationData.uf}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Logradouro *</Label>
                    <Input
                      value={digitizationData.logradouro}
                      onChange={(e) => setDigitizationData(prev => ({ ...prev, logradouro: e.target.value }))}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Número *</Label>
                      <Input
                        value={digitizationData.numero}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, numero: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={digitizationData.complemento}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, complemento: e.target.value }))}
                        placeholder="Apt 101"
                      />
                    </div>
                    <div>
                      <Label>Bairro *</Label>
                      <Input
                        value={digitizationData.bairro}
                        onChange={(e) => setDigitizationData(prev => ({ ...prev, bairro: e.target.value }))}
                        placeholder="Centro"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cidade *</Label>
                    <Input
                      value={digitizationData.cidade}
                      onChange={(e) => setDigitizationData(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="São Paulo"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dados da Proposta */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Proposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Desejado (R$)</Label>
                    <Input
                      type="number"
                      value={digitizationData.valorDesejado}
                      onChange={(e) => setDigitizationData(prev => ({ ...prev, valorDesejado: e.target.value }))}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  <div>
                    <Label>Prazo Desejado</Label>
                    <Select 
                      value={digitizationData.prazoDesejado} 
                      onValueChange={(value) => setDigitizationData(prev => ({ ...prev, prazoDesejado: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="36">36 meses</SelectItem>
                        <SelectItem value="48">48 meses</SelectItem>
                        <SelectItem value="60">60 meses</SelectItem>
                        <SelectItem value="72">72 meses</SelectItem>
                        <SelectItem value="84">84 meses</SelectItem>
                        <SelectItem value="96">96 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleDigitization}
                  disabled={digitizationMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {digitizationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Digitalizando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Digitalizar Proposta
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado da Digitalização */}
            {digitizationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {digitizationResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>Resultado da Digitalização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Badge variant={digitizationResult.success ? "default" : "destructive"}>
                      {digitizationResult.success ? "Sucesso" : "Falha"}
                    </Badge>
                    <span className="font-medium">Protocolo: {digitizationResult.protocoloId}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>Status:</span>
                    <Badge variant={
                      digitizationResult.status === 'aprovado' ? 'default' :
                      digitizationResult.status === 'reprovado' ? 'destructive' : 'secondary'
                    }>
                      {digitizationResult.status === 'aprovado' ? 'Aprovado' :
                       digitizationResult.status === 'reprovado' ? 'Reprovado' : 'Pendente'}
                    </Badge>
                  </div>

                  {digitizationResult.observacoes && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {digitizationResult.observacoes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {digitizationResult.status === 'aprovado' && !digitizationResult.linkFormalizacao && formalizationAttempts > 0 && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Aguardando link de formalização... (Tentativa {formalizationAttempts}/15)
                      </AlertDescription>
                    </Alert>
                  )}

                  {digitizationResult.linkFormalizacao && (
                    <div className="space-y-2">
                      <Label>Link de Formalização:</Label>
                      <div className="flex space-x-2">
                        <Input 
                          value={digitizationResult.linkFormalizacao} 
                          readOnly 
                          className="flex-1"
                        />
                        <Button
                          onClick={() => window.open(digitizationResult.linkFormalizacao, '_blank')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Abrir
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}