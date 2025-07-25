import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, Building2, CreditCard, FileText, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface C6Contract {
  Contrato: string;
  ValorParcela: number;
  Banco: string;
}

interface SimulationData {
  cpf: string;
  installment_quantity: number;
  selected_contracts: string[];
  simulation_type: 'POR_VALOR_SOLICITADO' | 'POR_VALOR_PARCELA';
  requested_amount?: number;
  installment_amount?: number;
}

interface CreditCondition {
  covenant: { code: string; description: string };
  product: { code: string; description: string };
  client_amount: number;
  installment_amount: number;
  installment_quantity: number;
  interest_rate: number;
  total_amount: number;
}

interface ProposalData {
  client: {
    tax_identifier: string;
    name: string;
    document_number: string;
    birth_date: string;
    mother_name: string;
    email: string;
    mobile_phone_area_code: string;
    mobile_phone_number: string;
    income_amount: number;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      federation_unit: string;
      zip_code: string;
    };
  };
  payment: {
    bank_code: string;
    agency_number: string;
    account_number: string;
    account_digit: string;
  };
}

export default function C6Simulation() {
  const [step, setStep] = useState<'cpf' | 'contracts' | 'simulation' | 'proposal' | 'formalization'>('cpf');
  const [cpf, setCpf] = useState('');
  const [benefitData, setBenefitData] = useState<any>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [installmentQuantity, setInstallmentQuantity] = useState(84);
  const [simulationType, setSimulationType] = useState<'POR_VALOR_SOLICITADO' | 'POR_VALOR_PARCELA'>('POR_VALOR_PARCELA');
  const [requestedAmount, setRequestedAmount] = useState<number>(0);
  const [creditConditions, setCreditConditions] = useState<CreditCondition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<CreditCondition | null>(null);
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [proposalNumber, setProposalNumber] = useState<string>('');
  const [formalizationStatus, setFormalizationStatus] = useState<'searching' | 'found' | 'error'>('searching');
  const [formalizationUrl, setFormalizationUrl] = useState<string>('');

  // Busca dados do CPF
  const { mutate: searchCPF, isPending: isSearching } = useMutation({
    mutationFn: async (cpfValue: string) => {
      return apiRequest('/api/multicorban/cpf', {
        method: 'POST',
        body: JSON.stringify({ cpf: cpfValue.replace(/\D/g, '') })
      });
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setBenefitData(data[0]);
        setStep('contracts');
      } else {
        toast({
          title: "Erro",
          description: "Nenhum benefício encontrado para este CPF",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na consulta",
        description: "Erro ao buscar dados do CPF",
        variant: "destructive"
      });
    }
  });

  // Simulação C6
  const { mutate: simulateC6, isPending: isSimulating } = useMutation({
    mutationFn: async (data: SimulationData) => {
      return apiRequest('/api/c6-bank/simulate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      if (data.credit_conditions) {
        setCreditConditions(data.credit_conditions);
        setStep('simulation');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na simulação",
        description: error.message || "Erro ao simular no C6 Bank",
        variant: "destructive"
      });
    }
  });

  // Inclusão de proposta
  const { mutate: includeProposal, isPending: isIncluding } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/c6-bank/include-proposal', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      if (data.proposal_number) {
        setProposalNumber(data.proposal_number);
        setStep('formalization');
        // Inicia o polling para buscar o link
        startFormalizationPolling(data.proposal_number);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na inclusão",
        description: error.message || "Erro ao incluir proposta no C6 Bank",
        variant: "destructive"
      });
    }
  });

  // Polling para link de formalização
  const startFormalizationPolling = async (proposalNum: string) => {
    setFormalizationStatus('searching');
    const maxAttempts = 15;
    const intervalTime = 20000; // 20 segundos

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await apiRequest(`/api/c6-bank/formalization-link/${proposalNum}`, {
          method: 'GET'
        });

        if (response.status === 'ACTIVE' && response.url) {
          setFormalizationUrl(response.url);
          setFormalizationStatus('found');
          toast({
            title: "Link encontrado!",
            description: "Link de formalização obtido com sucesso",
          });
          return;
        }
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou:`, error);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalTime));
      }
    }

    setFormalizationStatus('error');
    toast({
      title: "Timeout",
      description: "Não foi possível obter o link de formalização após 15 tentativas",
      variant: "destructive"
    });
  };

  const handleCPFSearch = () => {
    if (cpf.replace(/\D/g, '').length === 11) {
      searchCPF(cpf);
    } else {
      toast({
        title: "CPF inválido",
        description: "Digite um CPF válido com 11 dígitos",
        variant: "destructive"
      });
    }
  };

  const c6Contracts = benefitData?.Emprestimos?.filter((contract: C6Contract) => 
    contract.Banco === "626"
  ) || [];

  const selectedContractsData = c6Contracts.filter((contract: C6Contract) => 
    selectedContracts.includes(contract.Contrato)
  );

  const totalInstallmentAmount = selectedContractsData.reduce((sum: number, contract: C6Contract) => 
    sum + (contract.ValorParcela || 0), 0
  );

  const handleSimulation = () => {
    if (selectedContracts.length === 0) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione pelo menos um contrato para refinanciar",
        variant: "destructive"
      });
      return;
    }

    const simulationData: SimulationData = {
      cpf: benefitData.Beneficiario.CPF,
      installment_quantity: installmentQuantity,
      selected_contracts: selectedContracts,
      simulation_type: simulationType
    };

    if (simulationType === 'POR_VALOR_SOLICITADO') {
      simulationData.requested_amount = requestedAmount;
    } else {
      simulationData.installment_amount = totalInstallmentAmount;
    }

    simulateC6(simulationData);
  };

  const handleProposalSubmission = () => {
    if (!selectedCondition) return;

    const proposalPayload = {
      cpf: benefitData.Beneficiario.CPF,
      benefit_data: benefitData,
      selected_contracts: selectedContracts,
      credit_condition: selectedCondition,
      proposal_data: proposalData
    };

    includeProposal(proposalPayload);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Simulação C6 Bank</h1>
          <p className="text-muted-foreground">Sistema de simulação e digitalização de propostas C6 Bank</p>
        </div>

        {/* Step 1: CPF Search */}
        {step === 'cpf' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Consulta de CPF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cpf">CPF do Cliente</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <Button onClick={handleCPFSearch} disabled={isSearching} className="w-full">
                {isSearching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Buscar Dados
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contract Selection */}
        {step === 'contracts' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Seleção de Contratos C6 Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {c6Contracts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum contrato ativo do C6 Bank (626) encontrado para este cliente.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-3">
                    {c6Contracts.map((contract: C6Contract) => (
                      <div key={contract.Contrato} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id={contract.Contrato}
                          checked={selectedContracts.includes(contract.Contrato)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContracts([...selectedContracts, contract.Contrato]);
                            } else {
                              setSelectedContracts(selectedContracts.filter(c => c !== contract.Contrato));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor={contract.Contrato} className="flex-1 cursor-pointer">
                          <div className="font-medium">Contrato: {contract.Contrato}</div>
                          <div className="text-sm text-muted-foreground">
                            Parcela: {formatCurrency(contract.ValorParcela)}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {selectedContracts.length > 0 && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="font-medium">Resumo da Seleção:</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedContracts.length} contrato(s) selecionado(s)
                      </div>
                      <div className="text-sm font-medium">
                        Total das parcelas: {formatCurrency(totalInstallmentAmount)}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="simulation-type">Tipo de Simulação</Label>
                      <Select value={simulationType} onValueChange={(value: any) => setSimulationType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POR_VALOR_PARCELA">Por Valor da Parcela</SelectItem>
                          <SelectItem value="POR_VALOR_SOLICITADO">Por Valor Solicitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="installment-quantity">Prazo (meses)</Label>
                      <Input
                        id="installment-quantity"
                        type="number"
                        value={installmentQuantity}
                        onChange={(e) => setInstallmentQuantity(Number(e.target.value))}
                        min={12}
                        max={120}
                      />
                    </div>
                  </div>

                  {simulationType === 'POR_VALOR_SOLICITADO' && (
                    <div>
                      <Label htmlFor="requested-amount">Valor Solicitado</Label>
                      <Input
                        id="requested-amount"
                        type="number"
                        value={requestedAmount}
                        onChange={(e) => setRequestedAmount(Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <Button onClick={handleSimulation} disabled={isSimulating || selectedContracts.length === 0} className="w-full">
                    {isSimulating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Simular no C6 Bank
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Simulation Results */}
        {step === 'simulation' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Opções de Crédito C6 Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditConditions.map((condition, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCondition === condition ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCondition(condition)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{condition.covenant.description}</h3>
                      <p className="text-sm text-muted-foreground">{condition.product.description}</p>
                    </div>
                    <Badge variant={selectedCondition === condition ? "default" : "secondary"}>
                      Opção {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor Líquido:</span>
                      <div className="font-medium">{formatCurrency(condition.client_amount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parcela:</span>
                      <div className="font-medium">{formatCurrency(condition.installment_amount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prazo:</span>
                      <div className="font-medium">{condition.installment_quantity}x</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taxa:</span>
                      <div className="font-medium">{condition.interest_rate}% a.m.</div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedCondition && (
                <Button 
                  onClick={() => setStep('proposal')} 
                  className="w-full mt-4"
                >
                  Prosseguir com a Digitalização
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Proposal Form */}
        {step === 'proposal' && (
          <ProposalForm
            benefitData={benefitData}
            proposalData={proposalData}
            setProposalData={setProposalData}
            onSubmit={handleProposalSubmission}
            isLoading={isIncluding}
          />
        )}

        {/* Step 5: Formalization */}
        {step === 'formalization' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Formalização da Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="text-lg font-semibold mb-2">
                  Proposta Nº: {proposalNumber}
                </div>
                
                {formalizationStatus === 'searching' && (
                  <div className="flex flex-col items-center space-y-4">
                    <Clock className="h-12 w-12 animate-pulse text-orange-500" />
                    <div>
                      <div className="font-medium">Buscando link de formalização...</div>
                      <div className="text-sm text-muted-foreground">
                        Aguarde, tentativa em andamento (máximo 15 tentativas)
                      </div>
                    </div>
                  </div>
                )}

                {formalizationStatus === 'found' && (
                  <div className="flex flex-col items-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <div>
                      <div className="font-medium text-green-600 mb-4">Link de formalização disponível!</div>
                      <Button asChild size="lg">
                        <a href={formalizationUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir Formalização
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {formalizationStatus === 'error' && (
                  <div className="flex flex-col items-center space-y-4">
                    <XCircle className="h-12 w-12 text-red-500" />
                    <div>
                      <div className="font-medium text-red-600">Erro ao obter link</div>
                      <div className="text-sm text-muted-foreground">
                        Não foi possível obter o link de formalização após 15 tentativas
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Componente do formulário de proposta
function ProposalForm({ benefitData, proposalData, setProposalData, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: benefitData?.Beneficiario?.Nome || '',
    document_number: benefitData?.Beneficiario?.Rg || '',
    birth_date: benefitData?.Beneficiario?.DataNascimento || '',
    mother_name: benefitData?.Beneficiario?.NomeMae || '',
    email: 'naoinformado@gmail.com',
    mobile_phone_area_code: '11',
    mobile_phone_number: '',
    income_amount: benefitData?.ResumoFinanceiro?.ValorBeneficio || 0,
    street: benefitData?.Beneficiario?.Endereco || '',
    number: 'S/N',
    neighborhood: benefitData?.Beneficiario?.Bairro || '',
    city: benefitData?.Beneficiario?.Cidade || '',
    federation_unit: benefitData?.Beneficiario?.UF || '',
    zip_code: benefitData?.Beneficiario?.CEP || '',
    bank_code: benefitData?.DadosBancarios?.Banco || '',
    agency_number: benefitData?.DadosBancarios?.AgenciaPagto || '',
    account_number: benefitData?.DadosBancarios?.ContaPagto?.slice(0, -1) || '',
    account_digit: benefitData?.DadosBancarios?.ContaPagto?.slice(-1) || ''
  });

  const handleSubmit = () => {
    // Validar campos obrigatórios
    const requiredFields = ['name', 'document_number', 'birth_date', 'mother_name', 'street', 'neighborhood', 'city', 'zip_code', 'bank_code', 'agency_number', 'account_number'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha os campos: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setProposalData({
      client: {
        tax_identifier: benefitData.Beneficiario.CPF,
        name: formData.name,
        document_number: formData.document_number,
        birth_date: formData.birth_date,
        mother_name: formData.mother_name,
        email: formData.email,
        mobile_phone_area_code: formData.mobile_phone_area_code,
        mobile_phone_number: formData.mobile_phone_number,
        income_amount: formData.income_amount,
        address: {
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          federation_unit: formData.federation_unit,
          zip_code: formData.zip_code
        }
      },
      payment: {
        bank_code: formData.bank_code,
        agency_number: formData.agency_number,
        account_number: formData.account_number,
        account_digit: formData.account_digit
      }
    });

    onSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados para Digitalização da Proposta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={!formData.name ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="document_number">RG *</Label>
            <Input
              id="document_number"
              value={formData.document_number}
              onChange={(e) => setFormData({...formData, document_number: e.target.value})}
              className={!formData.document_number ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="birth_date">Data de Nascimento *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              className={!formData.birth_date ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="mother_name">Nome da Mãe *</Label>
            <Input
              id="mother_name"
              value={formData.mother_name}
              onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
              className={!formData.mother_name ? 'border-red-500' : ''}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="street">Endereço *</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({...formData, street: e.target.value})}
              className={!formData.street ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
              className={!formData.neighborhood ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className={!formData.city ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="zip_code">CEP *</Label>
            <Input
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
              className={!formData.zip_code ? 'border-red-500' : ''}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bank_code">Código do Banco *</Label>
            <Input
              id="bank_code"
              value={formData.bank_code}
              onChange={(e) => setFormData({...formData, bank_code: e.target.value})}
              className={!formData.bank_code ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="agency_number">Agência *</Label>
            <Input
              id="agency_number"
              value={formData.agency_number}
              onChange={(e) => setFormData({...formData, agency_number: e.target.value})}
              className={!formData.agency_number ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="account_number">Conta *</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData({...formData, account_number: e.target.value})}
              className={!formData.account_number ? 'border-red-500' : ''}
            />
          </div>
          <div>
            <Label htmlFor="account_digit">Dígito da Conta *</Label>
            <Input
              id="account_digit"
              value={formData.account_digit}
              onChange={(e) => setFormData({...formData, account_digit: e.target.value})}
              className={!formData.account_digit ? 'border-red-500' : ''}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Digitalizar Proposta
        </Button>
      </CardContent>
    </Card>
  );
}