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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface C6SimulationProps {
  cpf: string;
  dataNascimento: string;
  className?: string;
}

export function C6Simulation({ 
  cpf, 
  dataNascimento,
  className = ""
}: C6SimulationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'loading' | 'contracts' | 'simulation' | 'digitization' | 'formalization'>('loading');
  const [benefitData, setBenefitData] = useState<BenefitData | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [installmentQuantity, setInstallmentQuantity] = useState(84);
  const [manualInstallmentAmount, setManualInstallmentAmount] = useState<number | null>(null);
  const [creditConditions, setCreditConditions] = useState<CreditCondition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<CreditCondition | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<number>(-1);
  const [proposalNumber, setProposalNumber] = useState<string>('');
  const [formalizationUrl, setFormalizationUrl] = useState<string>('');
  const [formalizationAttempts, setFormalizationAttempts] = useState(0);
  
  // Dados para digitalização (pré-preenchidos)
  const [digitizationData, setDigitizationData] = useState({
    nomeCompleto: '',
    nomeMae: '',
    rg: '',
    telefone: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    banco: '',
    agencia: '',
    conta: ''
  });
  
  const { toast } = useToast();

  // Buscar dados completos do CPF
  const fetchBenefitData = useMutation({
    mutationFn: async (cpf: string) => {
      const response = await fetch('/api/multicorban/cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) throw new Error('Erro ao buscar dados do beneficiário');
      const data = await response.json();
      return data[0];
    },
    onSuccess: (data) => {
      setBenefitData(data);
      
      // Pré-preencher dados
      const beneficiario = data.Beneficiario;
      const bancarios = data.DadosBancarios;
      
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
        conta: bancarios.ContaPagto || ''
      });

      setStep('contracts');
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
    mutationFn: async () => {
      if (!benefitData || selectedContracts.length === 0) {
        throw new Error('Selecione pelo menos um contrato para simular');
      }
      
      const c6Contracts = benefitData.Emprestimos?.filter((emp: any) => 
        emp.Banco === '626' || emp.NomeBanco?.toLowerCase().includes('ficsa')
      ) || [];
      
      // Usar apenas contratos selecionados
      const selectedContractData = c6Contracts.filter((c: any) => 
        selectedContracts.includes(c.Contrato)
      );
      
      const totalParcela = manualInstallmentAmount || 
        selectedContractData.reduce((sum: number, c: any) => 
          sum + (c.ValorParcela || 0), 0
        );

      const response = await fetch('/api/c6-bank/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: benefitData.Beneficiario.CPF,
          installment_quantity: installmentQuantity,
          selected_contracts: selectedContracts, // Usar contratos selecionados
          simulation_type: 'POR_VALOR_PARCELA',
          installment_amount: totalParcela
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro na simulação C6 Bank');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCreditConditions(data.credit_conditions || []);
      setStep('digitization');
      toast({
        title: "Simulação concluída",
        description: `${data.credit_conditions?.length || 0} condição(ões) encontrada(s)`,
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
    mutationFn: async () => {
      if (!benefitData || !selectedCondition) {
        throw new Error('Dados incompletos para digitalização');
      }

      const c6Contracts = benefitData.Emprestimos?.filter((emp: any) => 
        emp.Banco === '626' || emp.NomeBanco?.toLowerCase().includes('ficsa')
      ) || [];

      const response = await fetch('/api/c6-bank/include-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: benefitData.Beneficiario.CPF,
          benefit_data: benefitData,
          selected_contracts: c6Contracts.map((c: any) => c.Contrato),
          credit_condition: selectedCondition,
          proposal_data: {
            client: {
              tax_identifier: benefitData.Beneficiario.CPF,
              name: digitizationData.nomeCompleto,
              document_number: digitizationData.rg,
              birth_date: benefitData.Beneficiario.DataNascimento,
              income_amount: parseFloat(benefitData.ResumoFinanceiro.ValorBeneficio || '0'),
              mother_name: digitizationData.nomeMae,
              email: digitizationData.email,
              mobile_phone_area_code: digitizationData.telefone.substring(0, 2),
              mobile_phone_number: digitizationData.telefone.substring(2),
              address: {
                zip_code: digitizationData.cep,
                street: digitizationData.logradouro,
                number: digitizationData.numero,
                complement: digitizationData.complemento,
                neighborhood: digitizationData.bairro,
                city: digitizationData.cidade,
                federation_unit: digitizationData.uf
              }
            },
            payment: {
              bank_code: digitizationData.banco,
              agency_number: digitizationData.agencia,
              account_number: digitizationData.conta.slice(0, -1),
              account_digit: digitizationData.conta.slice(-1)
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro na digitalização');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setProposalNumber(data.proposal_number);
      setStep('formalization');
      toast({
        title: "Proposta digitalizada",
        description: `Número da proposta: ${data.proposal_number}`,
      });
      
      // Iniciar busca do link
      setTimeout(() => {
        searchFormalizationLink(data.proposal_number);
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Erro na digitalização",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Buscar link de formalização
  const searchFormalizationLink = async (proposalNum: string) => {
    setFormalizationAttempts(0);
    
    const attempts = setInterval(async () => {
      try {
        setFormalizationAttempts(prev => prev + 1);
        
        const response = await fetch(`/api/c6-bank/formalization-link/${proposalNum}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ACTIVE') {
            setFormalizationUrl(data.url);
            clearInterval(attempts);
            toast({
              title: "Link de formalização obtido!",
              description: "Cliente pode assinar o contrato",
            });
          }
        }
        
        if (formalizationAttempts >= 10) {
          clearInterval(attempts);
          toast({
            title: "Timeout",
            description: "Link não disponível após 10 tentativas",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao buscar link:', error);
      }
    }, 15000); // 15 segundos entre tentativas
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 ${className}`}
          onClick={() => {
            setIsOpen(true);
            fetchBenefitData.mutate(cpf);
          }}
        >
          <Building2 className="h-3 w-3 mr-1" />
          C6 Bank
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Sistema C6 Bank - Refinanciamento
          </DialogTitle>
        </DialogHeader>

        {step === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span>Carregando dados do beneficiário...</span>
            </div>
          </div>
        )}

        {step === 'contracts' && benefitData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sistema C6 Bank - Refinanciamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seção 1: Seleção de Contratos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">1. Selecionar Contratos C6 Bank</h3>
                <p className="text-sm text-gray-600">
                  Selecione os contratos que deseja incluir no refinanciamento:
                </p>
                
                {(() => {
                  const c6Contracts = benefitData.Emprestimos?.filter((emp: any) => 
                    emp.Banco === '626' || emp.NomeBanco?.toLowerCase().includes('ficsa')
                  ) || [];
                  
                  if (c6Contracts.length === 0) {
                    return (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Nenhum contrato C6 Bank encontrado para este CPF.
                        </AlertDescription>
                      </Alert>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {c6Contracts.map((contract: any, index: number) => (
                        <div 
                          key={contract.Contrato}
                          className={`p-3 border rounded cursor-pointer transition-colors ${
                            selectedContracts.includes(contract.Contrato) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedContracts(prev => {
                              if (prev.includes(contract.Contrato)) {
                                return prev.filter(c => c !== contract.Contrato);
                              } else {
                                return [...prev, contract.Contrato];
                              }
                            });
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">Contrato: {contract.Contrato}</div>
                              <div className="text-sm text-gray-600">
                                Parcela: R$ {contract.ValorParcela?.toFixed(2)}
                              </div>
                              {contract.SaldoDevedor && (
                                <div className="text-sm text-gray-600">
                                  Saldo Devedor: R$ {contract.SaldoDevedor.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div className={`w-4 h-4 rounded border-2 ${
                              selectedContracts.includes(contract.Contrato)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedContracts.includes(contract.Contrato) && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {selectedContracts.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm font-medium text-blue-800">
                            Total selecionado: {selectedContracts.length} contrato(s)
                          </div>
                          <div className="text-sm text-blue-600">
                            Parcela total: R$ {
                              c6Contracts
                                .filter((c: any) => selectedContracts.includes(c.Contrato))
                                .reduce((sum: number, c: any) => sum + (c.ValorParcela || 0), 0)
                                .toFixed(2)
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Seção 2: Simulação */}
              {selectedContracts.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">2. Simulação de Refinanciamento</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Prazo Desejado (meses)
                      </label>
                      <select
                        value={installmentQuantity}
                        onChange={(e) => setInstallmentQuantity(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {[72, 84, 96, 108, 120].map(months => (
                          <option key={months} value={months}>{months} meses</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Parcela Atual Total
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={manualInstallmentAmount !== null ? manualInstallmentAmount : (() => {
                          if (!benefitData) return '';
                          const c6Contracts = benefitData.Emprestimos?.filter((emp: any) => 
                            emp.Banco === '626' || emp.NomeBanco?.toLowerCase().includes('ficsa')
                          ) || [];
                          const selectedContractData = c6Contracts.filter((c: any) => 
                            selectedContracts.includes(c.Contrato)
                          );
                          return selectedContractData.reduce((sum: number, c: any) => 
                            sum + (c.ValorParcela || 0), 0
                          );
                        })()}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setManualInstallmentAmount(value);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => simulationMutation.mutate()} 
                    disabled={simulationMutation.isPending}
                    className="w-full"
                  >
                    {simulationMutation.isPending ? (
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
              )}

              {/* Seção 3: Tabela de Condições de Crédito */}
              {creditConditions.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">3. Escolha a Condição de Crédito</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Prazo (meses)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Parcela</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Valor Liberado</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Taxa</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditConditions.map((condition, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-medium">
                              {condition.installment_quantity}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              R$ {condition.installment_amount?.toFixed(2)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              R$ {condition.net_amount?.toFixed(2)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {condition.interest_rate ? `${condition.interest_rate}%` : 'N/A'}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedCondition(index);
                                  setStep('digitization');
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Digitar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => setCreditConditions([])}
                    className="w-full"
                  >
                    Nova Simulação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}



        {step === 'digitization' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Digitalização da Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {creditConditions.length > 0 && (
                <div>
                  <Label>Escolha a Condição de Crédito</Label>
                  <div className="grid gap-2 mt-2">
                    {creditConditions.map((condition, index) => (
                      <div 
                        key={index}
                        className={`p-3 border rounded cursor-pointer ${
                          selectedCondition === condition ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedCondition(condition)}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{condition.covenant.description}</span>
                          <span className="text-green-600 font-bold">
                            Troco: R$ {condition.client_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Parcela: R$ {condition.installment_amount.toFixed(2)} | 
                          Taxa: {condition.interest_rate}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo *</Label>
                  <Input 
                    value={digitizationData.nomeCompleto}
                    onChange={(e) => setDigitizationData(prev => ({...prev, nomeCompleto: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>Nome da Mãe *</Label>
                  <Input 
                    value={digitizationData.nomeMae}
                    onChange={(e) => setDigitizationData(prev => ({...prev, nomeMae: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>RG *</Label>
                  <Input 
                    value={digitizationData.rg}
                    onChange={(e) => setDigitizationData(prev => ({...prev, rg: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input 
                    value={digitizationData.telefone}
                    onChange={(e) => setDigitizationData(prev => ({...prev, telefone: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>E-mail *</Label>
                  <Input 
                    type="email"
                    value={digitizationData.email}
                    onChange={(e) => setDigitizationData(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>CEP *</Label>
                  <Input 
                    value={digitizationData.cep}
                    onChange={(e) => setDigitizationData(prev => ({...prev, cep: e.target.value}))}
                  />
                </div>
                <div>
                  <Label>Conta Pagamento *</Label>
                  <Input 
                    value={digitizationData.conta}
                    onChange={(e) => setDigitizationData(prev => ({...prev, conta: e.target.value}))}
                    placeholder="Ex: 0554444"
                  />
                </div>
              </div>

              <Button 
                onClick={() => digitizationMutation.mutate()} 
                disabled={digitizationMutation.isPending || !selectedCondition}
                className="w-full"
              >
                {digitizationMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Digitalizando Proposta...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" /> Digitalizar Proposta</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'formalization' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Proposta Digitalizada com Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Número da Proposta:</strong> {proposalNumber}
                </AlertDescription>
              </Alert>

              {formalizationUrl ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Link de formalização disponível!</p>
                  </div>
                  <Button 
                    onClick={() => window.open(formalizationUrl, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Abrir Link de Assinatura
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-800">Aguardando link de formalização...</p>
                    <p className="text-sm text-gray-600">
                      Tentativa {formalizationAttempts}/10
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}