import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calculator, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ErrorDisplay } from "@/components/error-display";

interface SimulationResult {
  valorAF: number;
  prazo: string;
  descricaoPlano: string;
  taxa: number;
  valorParcela: number;
  valorTotal: number;
  tabela?: Array<{
    parcela: number;
    valorParcela: number;
    valorJuros: number;
    valorAmortizacao: number;
    saldoDevedor: number;
  }>;
}

interface BanrisulSimulationProps {
  cpf: string;
  dataNascimento: string;
  contrato: string;
  dataContrato: string;
  valorParcela: number;
  conveniada: string;
  className?: string;
}

export function BanrisulSimulation({ 
  cpf, 
  dataNascimento, 
  contrato, 
  dataContrato, 
  valorParcela, 
  conveniada,
  className = ""
}: BanrisulSimulationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customParcela, setCustomParcela] = useState(valorParcela.toString());
  const [prazo, setPrazo] = useState("096");
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [allOptions, setAllOptions] = useState<SimulationResult[]>([]);
  const { toast } = useToast();

  const simulationMutation = useMutation({
    mutationFn: async (params: {
      cpf: string;
      dataNascimento: string;
      conveniada: string;
      contrato: string;
      dataContrato: string;
      prestacao: number;
    }) => {
      const response = await fetch('/api/banrisul/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: 'Erro na simulação', 
          title: 'Erro de Comunicação',
          details: 'Falha na comunicação com o servidor'
        }));
        
        throw new Error(errorData.error || 'Erro na simulação');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      console.log('Dados recebidos da API:', data);
      if (data && data.length > 0) {
        // Debug: mostrar estrutura dos dados
        console.log('Primeira opção:', data[0]);
        console.log('Campos disponíveis:', Object.keys(data[0]));
        
        setAllOptions(data);
        setSimulationResult(data.find(option => option.prazo === prazo) || data[0]);
        toast({
          title: "Simulação Concluída",
          description: `${data.length} opção(ões) de refinanciamento encontrada(s)!`,
        });
      } else {
        toast({
          title: "Nenhuma Opção Encontrada",
          description: "Não foi possível encontrar opções de refinanciamento para os parâmetros informados.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na Simulação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSimulation = () => {
    simulationMutation.mutate({
      cpf,
      dataNascimento,
      conveniada,
      contrato,
      dataContrato,
      prestacao: parseFloat(customParcela),
    });
  };

  const handlePrazoChange = (newPrazo: string) => {
    setPrazo(newPrazo);
    if (allOptions.length > 0) {
      const selectedOption = allOptions.find(option => option.prazo === newPrazo);
      if (selectedOption) {
        setSimulationResult(selectedOption);
      }
    }
  };

  // Prazos disponíveis no Banrisul (apenas 3 prazos conforme regra interna)
  const banrisulPrazos = ["096", "090", "084"];
  
  const prazoOptions = allOptions.length > 0 
    ? Array.from(new Set(allOptions.map(option => option.prazo)))
        .sort((a, b) => parseInt(b) - parseInt(a)) // Ordenar decrescente
        .map(prazo => ({
          value: prazo,
          label: `${prazo} meses`
        }))
    : banrisulPrazos.map(prazo => ({
        value: prazo,
        label: `${prazo} meses`
      }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className={`bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white dark:text-white border-0 min-w-[80px] h-8 px-3 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${className}`}
        >
          <Calculator className="h-3 w-3 mr-1" />
          Simular
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-green-600" />
            <span>Simulação de Refinanciamento Banrisul</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Dados do Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contrato</Label>
                  <p className="font-mono text-sm">{contrato}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data do Contrato</Label>
                  <p className="text-sm">{new Date(dataContrato).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Valor Original da Parcela</Label>
                <p className="text-sm font-semibold">{formatCurrency(valorParcela)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros da Simulação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parcela">Valor da Parcela</Label>
                  <Input
                    id="parcela"
                    type="number"
                    step="0.01"
                    value={customParcela}
                    onChange={(e) => setCustomParcela(e.target.value)}
                    placeholder="Digite o valor da parcela"
                  />
                </div>
                <div>
                  <Label htmlFor="prazo">Prazo{allOptions.length > 0 && ` (${allOptions.length} opções disponíveis)`}</Label>
                  <Select value={prazo} onValueChange={handlePrazoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o prazo" />
                    </SelectTrigger>
                    <SelectContent>
                      {prazoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleSimulation}
                  disabled={simulationMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {simulationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Simulando...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Simular Refinanciamento
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Erro */}
          {simulationMutation.error && (
            <ErrorDisplay 
              error={simulationMutation.error} 
              onRetry={() => simulationMutation.reset()}
            />
          )}

          {/* Resultado da Simulação */}
          {simulationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Resultado da Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Valor Liberado</Label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(simulationResult.valorAF)}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Prazo</Label>
                    <p className="text-lg font-bold">{simulationResult.prazo} meses</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Taxa ao Mês</Label>
                    <p className="text-lg font-bold">
                      {simulationResult.taxaMes ? `${parseFloat(simulationResult.taxaMes).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Nova Parcela</Label>
                    <p className="text-lg font-bold">
                      {Math.abs(parseFloat(customParcela) - valorParcela) < 0.01 
                        ? formatCurrency(valorParcela)
                        : formatCurrency(parseFloat(customParcela))
                      }
                    </p>
                    {Math.abs(parseFloat(customParcela) - valorParcela) < 0.01 && (
                      <p className="text-sm text-muted-foreground">Manteve a mesma parcela</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Plano Ofertado</p>
                  <p className="font-semibold">{simulationResult.descricaoPlano}</p>
                </div>

                {/* Tabela de Amortização */}
                {simulationResult.tabela && simulationResult.tabela.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3">Tabela de Amortização</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Parcela</TableHead>
                            <TableHead>Valor Parcela</TableHead>
                            <TableHead>Juros</TableHead>
                            <TableHead>Amortização</TableHead>
                            <TableHead>Saldo Devedor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulationResult.tabela.map((row) => (
                            <TableRow key={row.parcela}>
                              <TableCell className="font-medium">{row.parcela}</TableCell>
                              <TableCell>{formatCurrency(row.valorParcela)}</TableCell>
                              <TableCell>{formatCurrency(row.valorJuros)}</TableCell>
                              <TableCell>{formatCurrency(row.valorAmortizacao)}</TableCell>
                              <TableCell>{formatCurrency(row.saldoDevedor)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabela de Opções do Prazo Selecionado */}
          {allOptions.length > 0 && prazo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  Opções Disponíveis para {prazo} meses ({allOptions.filter(option => option.prazo === prazo).length} opções)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Plano (Tabela)</TableHead>
                        <TableHead className="text-right">Valor Liberado</TableHead>
                        <TableHead className="text-right">Taxa ao Mês</TableHead>
                        <TableHead className="text-right">Nova Parcela</TableHead>
                        <TableHead className="text-center">Selecionar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOptions
                        .filter(option => option.prazo === prazo)
                        .map((option, index) => (
                          <TableRow key={`${option.prazo}-${option.descricaoPlano}-${index}`} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{option.descricaoPlano}</TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(option.valorAF)}
                            </TableCell>
                            <TableCell className="text-right">
                              {option.taxaMes ? `${parseFloat(option.taxaMes).toFixed(2)}%` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                {Math.abs(parseFloat(customParcela) - valorParcela) < 0.01 
                                  ? formatCurrency(valorParcela)
                                  : formatCurrency(parseFloat(customParcela))
                                }
                                {Math.abs(parseFloat(customParcela) - valorParcela) < 0.01 && (
                                  <div className="text-xs text-muted-foreground">Manteve a mesma</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSimulationResult(option);
                                }}
                                className={`text-xs ${
                                  simulationResult?.prazo === option.prazo && 
                                  simulationResult?.descricaoPlano === option.descricaoPlano
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : ''
                                }`}
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}