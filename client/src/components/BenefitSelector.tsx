import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Download } from "lucide-react";
import { Benefit } from "@shared/schema";
// Função auxiliar para formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BenefitSelectorProps {
  benefits: Benefit[];
  cpf: string;
  onBenefitSelect: (benefitNumber: string) => void;
}

export function BenefitSelector({ benefits, cpf, onBenefitSelect }: BenefitSelectorProps) {
  const [selectedBenefit, setSelectedBenefit] = useState<string>('');
  const [saveType, setSaveType] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para formatação de CPF
  const formatCPF = (cpf: string): string => {
    const cleaned = cpf.replace(/\D/g, '');
    const padded = cleaned.padStart(11, '0');
    return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Mutation para salvar consulta
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/consultations', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Consulta Salva",
        description: "Consulta registrada no histórico com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar consulta:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a consulta.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!selectedBenefit) {
      toast({
        title: "Selecione um Benefício",
        description: "Escolha um benefício para salvar a consulta.",
        variant: "destructive",
      });
      return;
    }

    const benefit = benefits.find(b => b.Beneficiario.Beneficio === selectedBenefit);
    if (!benefit) return;

    const consultationData = {
      searchType: 'cpf' as const,
      searchValue: cpf,
      cpf: formatCPF(cpf),
      benefitNumber: selectedBenefit,
      beneficiaryName: benefit.Beneficiario.Nome,
      benefitValue: benefit.ResumoFinanceiro?.ValorBeneficio || 0,
      availableMargin: benefit.ResumoFinanceiro?.MargemDisponivelEmprestimo || 0,
      loanBlocked: benefit.Beneficiario?.BloqueadoEmprestimo === 'SIM',
      blockReason: benefit.Beneficiario?.BloqueadoEmprestimo === 'SIM' ? 'Benefício bloqueado para empréstimo' : null,
      resultData: benefit,
      clientName: benefit.Beneficiario.Nome
    };

    saveMutation.mutate(consultationData);
  };

  const handleViewDetails = () => {
    if (!selectedBenefit) {
      toast({
        title: "Selecione um Benefício",
        description: "Escolha um benefício para ver os detalhes.",
        variant: "destructive",
      });
      return;
    }
    onBenefitSelect(selectedBenefit);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Benefícios Encontrados - CPF: {formatCPF(cpf)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de benefícios */}
        <div className="grid gap-3">
          {benefits.map((benefit, index) => (
            <div 
              key={`${benefit.Beneficiario.Beneficio}-${index}`}
              className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Benefício:</span>
                    <Badge variant="outline">{benefit.Beneficiario.Beneficio}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Nome:</span> {benefit.Beneficiario.Nome}
                  </div>
                  {benefit.ResumoFinanceiro && (
                    <div className="flex gap-4 text-sm">
                      <span>
                        <span className="font-medium">Valor:</span> {formatCurrency(benefit.ResumoFinanceiro.ValorBeneficio)}
                      </span>
                      <span>
                        <span className="font-medium">Margem:</span> {formatCurrency(benefit.ResumoFinanceiro.MargemDisponivelEmprestimo)}
                      </span>
                    </div>
                  )}
                </div>
                {benefit.Beneficiario?.BloqueadoEmprestimo === 'SIM' && (
                  <Badge variant="destructive">Bloqueado</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Seleção de benefício */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Selecionar Benefício</label>
            <Select value={selectedBenefit} onValueChange={setSelectedBenefit}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Escolha um benefício..." />
              </SelectTrigger>
              <SelectContent>
                {benefits.map((benefit, index) => (
                  <SelectItem 
                    key={`${benefit.Beneficiario.Beneficio}-${index}`}
                    value={benefit.Beneficiario.Beneficio}
                  >
                    {benefit.Beneficiario.Beneficio} - {benefit.Beneficiario.Nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={!selectedBenefit || saveMutation.isPending}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Consulta'}
            </Button>
            
            <Button 
              onClick={handleViewDetails}
              disabled={!selectedBenefit}
            >
              Ver Detalhes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}