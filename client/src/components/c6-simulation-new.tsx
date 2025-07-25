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
    Endereco: string;
    Numero: string;
    Complemento: string;
    Bairro: string;
    Cidade: string;
    UF: string;
    UFBeneficio: string;
    Sexo: string;
    EstadoCivil: string;
    OrgaoExpedidor: string;
    DataEmissaoRG: string;
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
  covenant: { code: string; description: string; rate_percentage?: number };
  product: { code: string; description: string };
  client_amount: number;
  installment_amount: number;
  installment_quantity: number;
  interest_rate: number;
  monthly_customer_rate?: number;
  total_amount: number;
  expenses?: Array<{
    code: string;
    description: string;
    type_code: string;
    item_number: string;
    group_code: string;
    amount: number;
    exempt: string;
    financed_expense: boolean;
    description_type: string;
    observation: string;
    changes_default: boolean;
    minimum_amount: number;
    maximum_amount: number;
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
  const [selectedExpense, setSelectedExpense] = useState<string>('none'); // Default: sem seguro
  const [proposalNumber, setProposalNumber] = useState<string>('');
  const [formalizationUrl, setFormalizationUrl] = useState<string>('');
  const [formalizationAttempts, setFormalizationAttempts] = useState(0);

  // Dados para digitalização (pré-preenchidos)
  const [bankSuggestions, setBankSuggestions] = useState<Array<{code: string, name: string}>>([]);
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);

  const bankList = [
    { code: "001", name: "Banco do Brasil" },
    { code: "033", name: "Santander" },
    { code: "104", name: "Caixa Econômica Federal" },
    { code: "237", name: "Bradesco" },
    { code: "341", name: "Itaú" },
    { code: "745", name: "Citibank" },
    { code: "399", name: "HSBC" },
    { code: "422", name: "Safra" },
    { code: "070", name: "BRB" },
    { code: "756", name: "Sicoob" },
    { code: "748", name: "Sicredi" },
    { code: "626", name: "C6 Bank" },
    { code: "260", name: "Nu Pagamentos (Nubank)" },
    { code: "290", name: "Pagseguro" },
    { code: "336", name: "C6 Consignado" }
  ];

  // Função para aplicar máscara de telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
    if (match) {
      return `${match[1] ? `(${match[1]}` : ''}${match[2] ? `) ${match[2]}` : ''}${match[3] ? `-${match[3]}` : ''}`;
    }
    return value;
  };

  // Função para aplicar máscara de CEP
  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,5})(\d{0,3})$/);
    if (match) {
      return `${match[1]}${match[2] ? `-${match[2]}` : ''}`;
    }
    return value;
  };

  // Função para buscar bancos
  const searchBanks = (query: string) => {
    if (!query) {
      setBankSuggestions([]);
      setShowBankSuggestions(false);
      return;
    }

    const filtered = bankList.filter(bank => 
      bank.code.includes(query) || 
      bank.name.toLowerCase().includes(query.toLowerCase())
    );
    setBankSuggestions(filtered.slice(0, 5));
    setShowBankSuggestions(true);
  };

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
    estadoCivil: 'Solteiro',
    sexo: 'Masculino',
    ufRg: 'SP',
    orgaoExpedidor: 'SSP',
    dataEmissaoRg: '2010-01-01',
    pessoaPoliticamenteExposta: 'Nao',
    nomeConjuge: '',
    recebeCartaoBeneficio: 'Nao',
    ufBeneficio: '',
    banco: '',
    agencia: '',
    conta: '',
    digitoAgencia: '0',
    tipoContaDescricao: 'ContaCorrenteIndividual'
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
        rg: beneficiario.RG || beneficiario.Rg || '',
        telefone: beneficiario.Telefone ? formatPhone(beneficiario.Telefone) : '',
        email: beneficiario.Email || 'naoinformado@gmail.com',
        cep: beneficiario.CEP ? formatCEP(beneficiario.CEP) : '',
        logradouro: beneficiario.Logradouro || beneficiario.Endereco || '',
        numero: beneficiario.Numero || 'S/N',
        complemento: beneficiario.Complemento || '',
        bairro: beneficiario.Bairro || '',
        cidade: beneficiario.Cidade || '',
        uf: beneficiario.UF || '',
        estadoCivil: beneficiario.EstadoCivil || 'Solteiro',
        sexo: beneficiario.Sexo === 'F' ? 'Feminino' : beneficiario.Sexo === 'M' ? 'Masculino' : beneficiario.Sexo || 'Masculino',
        ufRg: beneficiario.UF || 'SP',
        orgaoExpedidor: beneficiario.OrgaoExpedidor || 'SSP',
        dataEmissaoRg: beneficiario.DataEmissaoRG || '2010-01-01',
        pessoaPoliticamenteExposta: 'Nao',
        nomeConjuge: '',
        recebeCartaoBeneficio: 'Nao',
        ufBeneficio: beneficiario.UFBeneficio || beneficiario.UF || '',
        banco: bancarios.Banco || '',
        agencia: bancarios.AgenciaPagto || '',
        conta: bancarios.ContaPagto || '',
        digitoAgencia: '0',
        tipoContaDescricao: 'ContaCorrenteIndividual'
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
      console.log('🎯 SIMULATION SUCCESS - Credit conditions:', data.credit_conditions?.length);
      if (data.credit_conditions?.[0]?.expenses) {
        console.log('🎯 First condition expenses:', data.credit_conditions[0].expenses.map(e => ({code: e.code, desc: e.description_type})));
      }
      setCreditConditions(data.credit_conditions || []);
      // Reset expense selection quando nova simulação
      setSelectedExpense('none');
      // NÃO muda o step - permanece no mesmo card mostrando a tabela
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
          selected_expense: selectedExpense === 'none' ? '' : selectedExpense,
          debug_expense: selectedExpense, // Log para debug
          proposal_data: {
            client: {
              tax_identifier: benefitData.Beneficiario.CPF,
              name: digitizationData.nomeCompleto,
              document_type: "RG",
              document_number: digitizationData.rg,
              document_federation_unit: digitizationData.ufRg,
              issuance_date: digitizationData.dataEmissaoRg,
              government_agency_which_has_issued_the_document: digitizationData.orgaoExpedidor,
              marital_status: digitizationData.estadoCivil,
              spouses_name: digitizationData.nomeConjuge,
              politically_exposed_person: digitizationData.pessoaPoliticamenteExposta,
              birth_date: benefitData.Beneficiario.DataNascimento,
              gender: digitizationData.sexo,
              income_amount: parseFloat(benefitData.ResumoFinanceiro.ValorBeneficio || '0'),
              mother_name: digitizationData.nomeMae,
              email: digitizationData.email,
              mobile_phone_area_code: digitizationData.telefone.substring(0, 2),
              mobile_phone_number: digitizationData.telefone.substring(2),
              bank_data: {
                bank_code: digitizationData.banco.replace(/\D/g, ''),
                agency_number: digitizationData.agencia.replace(/\D/g, ''),
                agency_digit: digitizationData.digitoAgencia,
                account_type: digitizationData.tipoContaDescricao,
                account_number: digitizationData.conta.length > 1 ? digitizationData.conta.slice(0, -1) : digitizationData.conta,
                account_digit: digitizationData.conta.length > 1 ? digitizationData.conta.slice(-1) : ""
              },
              benefit_data: {
                receive_card_benefit: digitizationData.recebeCartaoBeneficio,
                federation_unit: digitizationData.ufBeneficio
              },
              address: {
                street: digitizationData.logradouro,
                number: digitizationData.numero,
                neighborhood: digitizationData.bairro,
                city: digitizationData.cidade,
                federation_unit: digitizationData.uf,
                zip_code: digitizationData.cep
              },
              professional_data: {
                enrollment: benefitData.Beneficiario.Beneficio
              }
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
      console.log('Digitalização successful:', data);
      console.log('Expense selected at success:', selectedExpense);
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
                          <th className="border border-gray-200 px-4 py-2 text-left">Tabela</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Prazo (meses)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Parcela</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Troco</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Taxa</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditConditions.map((condition, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-medium">
                              {condition.covenant?.description || `Tabela ${condition.covenant?.code || index + 1}`}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {condition.installment_quantity} meses
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              R$ {condition.installment_amount?.toFixed(2)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-green-600 font-medium">
                              R$ {condition.client_amount?.toFixed(2)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {condition.monthly_customer_rate ? `${condition.monthly_customer_rate}%` :
                               condition.covenant?.rate_percentage ? `${condition.covenant.rate_percentage}%` : 
                               condition.interest_rate ? `${condition.interest_rate}%` : 'N/A'}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedCondition(condition);
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
              {selectedCondition && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Condição Selecionada</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{selectedCondition.covenant.description}</span>
                    <span className="text-green-600 font-bold">
                      Troco: R$ {selectedCondition.client_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Parcela: R$ {selectedCondition.installment_amount.toFixed(2)} | 
                    Taxa: {selectedCondition.monthly_customer_rate ? `${selectedCondition.monthly_customer_rate}%` :
                           selectedCondition.covenant?.rate_percentage ? `${selectedCondition.covenant.rate_percentage}%` : 
                           selectedCondition.interest_rate ? `${selectedCondition.interest_rate}%` : 'N/A'}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Dados Pessoais</h3>
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
                      <Label>UF do RG *</Label>
                      <Select value={digitizationData.ufRg} onValueChange={(value) => setDigitizationData(prev => ({...prev, ufRg: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE', 'PA', 'MA', 'PB', 'ES', 'PI', 'AL', 'RN', 'MT', 'MS', 'DF', 'SE', 'AM', 'RO', 'AC', 'AP', 'RR', 'TO'].map(uf => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Órgão Expedidor *</Label>
                      <Select value={digitizationData.orgaoExpedidor} onValueChange={(value) => setDigitizationData(prev => ({...prev, orgaoExpedidor: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SSP">SSP</SelectItem>
                          <SelectItem value="IFP">IFP</SelectItem>
                          <SelectItem value="DETRAN">DETRAN</SelectItem>
                          <SelectItem value="PC">PC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data Emissão RG *</Label>
                      <Input 
                        type="date"
                        value={digitizationData.dataEmissaoRg}
                        onChange={(e) => setDigitizationData(prev => ({...prev, dataEmissaoRg: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Estado Civil *</Label>
                      <Select value={digitizationData.estadoCivil} onValueChange={(value) => setDigitizationData(prev => ({...prev, estadoCivil: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Solteiro">Solteiro</SelectItem>
                          <SelectItem value="Casado">Casado</SelectItem>
                          <SelectItem value="Divorciado">Divorciado</SelectItem>
                          <SelectItem value="Viuvo">Viúvo</SelectItem>
                          <SelectItem value="UniaoEstavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sexo *</Label>
                      <Select value={digitizationData.sexo} onValueChange={(value) => setDigitizationData(prev => ({...prev, sexo: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {digitizationData.estadoCivil === 'Casado' && (
                      <div>
                        <Label>Nome do Cônjuge</Label>
                        <Input 
                          value={digitizationData.nomeConjuge}
                          onChange={(e) => setDigitizationData(prev => ({...prev, nomeConjuge: e.target.value}))}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Pessoa Politicamente Exposta *</Label>
                      <Select value={digitizationData.pessoaPoliticamenteExposta} onValueChange={(value) => setDigitizationData(prev => ({...prev, pessoaPoliticamenteExposta: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nao">Não</SelectItem>
                          <SelectItem value="Sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Contato</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Telefone *</Label>
                      <Input 
                        value={digitizationData.telefone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setDigitizationData(prev => ({...prev, telefone: formatted}));
                        }}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
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
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Endereço</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CEP *</Label>
                      <Input 
                        value={digitizationData.cep}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          setDigitizationData(prev => ({...prev, cep: formatted}));
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    <div>
                      <Label>Logradouro *</Label>
                      <Input 
                        value={digitizationData.logradouro}
                        onChange={(e) => setDigitizationData(prev => ({...prev, logradouro: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Número *</Label>
                      <Input 
                        value={digitizationData.numero}
                        onChange={(e) => setDigitizationData(prev => ({...prev, numero: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input 
                        value={digitizationData.complemento}
                        onChange={(e) => setDigitizationData(prev => ({...prev, complemento: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Bairro *</Label>
                      <Input 
                        value={digitizationData.bairro}
                        onChange={(e) => setDigitizationData(prev => ({...prev, bairro: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Cidade *</Label>
                      <Input 
                        value={digitizationData.cidade}
                        onChange={(e) => setDigitizationData(prev => ({...prev, cidade: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>UF *</Label>
                      <Select value={digitizationData.uf} onValueChange={(value) => setDigitizationData(prev => ({...prev, uf: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE', 'PA', 'MA', 'PB', 'ES', 'PI', 'AL', 'RN', 'MT', 'MS', 'DF', 'SE', 'AM', 'RO', 'AC', 'AP', 'RR', 'TO'].map(uf => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Dados Bancários */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Dados Bancários</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Label>Banco *</Label>
                      <Input 
                        value={digitizationData.banco}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDigitizationData(prev => ({...prev, banco: value}));
                          searchBanks(value);
                        }}
                        onFocus={() => {
                          if (digitizationData.banco) {
                            searchBanks(digitizationData.banco);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowBankSuggestions(false), 200);
                        }}
                        placeholder="Digite código ou nome do banco"
                      />
                      {showBankSuggestions && bankSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {bankSuggestions.map((bank) => (
                            <div
                              key={bank.code}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setDigitizationData(prev => ({...prev, banco: `${bank.code} - ${bank.name}`}));
                                setShowBankSuggestions(false);
                              }}
                            >
                              <span className="font-medium">{bank.code}</span> - {bank.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Agência *</Label>
                      <Input 
                        value={digitizationData.agencia}
                        onChange={(e) => setDigitizationData(prev => ({...prev, agencia: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Conta *</Label>
                      <Input 
                        value={digitizationData.conta}
                        onChange={(e) => setDigitizationData(prev => ({...prev, conta: e.target.value}))}
                        placeholder="Ex: 0554444"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Conta *</Label>
                      <Select value={digitizationData.tipoContaDescricao} onValueChange={(value) => setDigitizationData(prev => ({...prev, tipoContaDescricao: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ContaCorrenteIndividual">Conta Corrente Individual</SelectItem>
                          <SelectItem value="ContaPoupancaIndividual">Conta Poupança Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Dados do Benefício */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Dados do Benefício</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Recebe Cartão Benefício *</Label>
                      <Select value={digitizationData.recebeCartaoBeneficio} onValueChange={(value) => setDigitizationData(prev => ({...prev, recebeCartaoBeneficio: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nao">Não</SelectItem>
                          <SelectItem value="Sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>UF do Benefício *</Label>
                      <Select value={digitizationData.ufBeneficio} onValueChange={(value) => setDigitizationData(prev => ({...prev, ufBeneficio: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE', 'PA', 'MA', 'PB', 'ES', 'PI', 'AL', 'RN', 'MT', 'MS', 'DF', 'SE', 'AM', 'RO', 'AC', 'AP', 'RR', 'TO'].map(uf => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de Seleção de Seguros/Despesas */}
              {selectedCondition?.expenses && selectedCondition.expenses.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Seguros e Serviços Opcionais</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Selecione o seguro desejado *</Label>
                      <select 
                        value={selectedExpense}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          console.log('🔥 CHANGE EVENT - Seguro selecionado:', newValue);
                          console.log('🔥 Event target selectedIndex:', e.target.selectedIndex);
                          console.log('🔥 All expenses codes:', selectedCondition.expenses?.map(exp => exp.code));
                          setSelectedExpense(newValue);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        style={{ minHeight: '44px' }}
                      >
                        <option value="none">✅ Sem seguro adicional (Recomendado) - R$ 0,00</option>
                        {selectedCondition.expenses.map((expense, index) => {
                          console.log('📦 Renderizando expense:', index, expense.code, expense.description_type, expense.amount);
                          return (
                            <option 
                              key={`expense-${index}-${expense.code}`} 
                              value={expense.code}
                              disabled={false}
                            >
                              {expense.description_type} - R$ {expense.amount.toFixed(2)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Debug: Mostrar expense selecionado */}
                    {selectedExpense !== 'none' && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Seguro selecionado:</strong> {
                          selectedCondition.expenses.find(e => e.code === selectedExpense)?.description_type || 'N/A'
                        } - R$ {
                          selectedCondition.expenses.find(e => e.code === selectedExpense)?.amount.toFixed(2) || '0.00'
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => {
                  console.log('Starting digitization with selected expense:', selectedExpense);
                  digitizationMutation.mutate();
                }} 
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

                  <div className="space-y-2">
                    <Label htmlFor="formalization-link">Link para Cópia</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="formalization-link"
                        value={formalizationUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(formalizationUrl);
                          toast({ title: "Link copiado!", description: "Link de formalização copiado para a área de transferência" });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Copiar
                      </Button>
                    </div>
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