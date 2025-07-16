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
      if (data && data.length > 0) {
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

  const prazoOptions = allOptions.length > 0 
    ? allOptions.map(option => ({
        value: option.prazo,
        label: `${option.prazo} meses`
      }))
    : [
        { value: "024", label: "24 meses" },
        { value: "036", label: "36 meses" },
        { value: "048", label: "48 meses" },
        { value: "060", label: "60 meses" },
        { value: "072", label: "72 meses" },
        { value: "084", label: "84 meses" },
        { value: "096", label: "96 meses" },
      ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-green-600 hover:text-green-700 border-green-300 hover:border-green-400 ${className}`}
        >
          <Calculator className="h-4 w-4 mr-2" />
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
                    <Label className="text-sm font-medium text-muted-foreground">Taxa</Label>
                    <p className="text-lg font-bold">{simulationResult.taxa}%</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Nova Parcela</Label>
                    <p className="text-lg font-bold">{formatCurrency(simulationResult.valorParcela)}</p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}