import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Search, Download, Calendar, User, AlertTriangle, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatação de CPF
const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  const padded = cleaned.padStart(11, '0');
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export function ConsultationHistory() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  // Query para buscar consultas
  const { data: consultations, isLoading } = useQuery({
    queryKey: ['/api/consultations', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/consultations?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao carregar consultas');
      return response.json();
    }
  });

  const exportToCSV = () => {
    if (!consultations || consultations.length === 0) return;

    const headers = [
      'Data da Consulta',
      'CPF',
      'Nome do Beneficiário',
      'Número do Benefício',
      'Valor do Benefício',
      'Margem Disponível',
      'Status do Empréstimo',
      'Tipo de Consulta'
    ];

    const csvData = consultations.map((consultation: any) => [
      format(new Date(consultation.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      consultation.cpf || formatCPF(consultation.searchValue),
      consultation.beneficiaryName || 'N/A',
      consultation.benefitNumber || 'N/A',
      consultation.benefitValue ? formatCurrency(consultation.benefitValue) : 'N/A',
      consultation.availableMargin ? formatCurrency(consultation.availableMargin) : 'N/A',
      consultation.loanBlocked ? 'Bloqueado' : 'Liberado',
      consultation.searchType === 'cpf' ? 'Por CPF' : 'Por Benefício'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consultas_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Histórico de Consultas
        </CardTitle>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === '7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('7')}
            >
              7 dias
            </Button>
            <Button
              variant={selectedPeriod === '30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('30')}
            >
              30 dias
            </Button>
            <Button
              variant={selectedPeriod === '90' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('90')}
            >
              90 dias
            </Button>
          </div>
          
          <Button 
            onClick={exportToCSV}
            disabled={!consultations || consultations.length === 0}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando consultas...</p>
          </div>
        ) : consultations && consultations.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Benefício</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.map((consultation: any) => (
                  <TableRow key={consultation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(consultation.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {consultation.cpf || formatCPF(consultation.searchValue)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {consultation.beneficiaryName || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {consultation.benefitNumber || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-sm">
                          {consultation.benefitValue ? formatCurrency(consultation.benefitValue) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-blue-600" />
                        <span className="text-sm">
                          {consultation.availableMargin ? formatCurrency(consultation.availableMargin) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {consultation.loanBlocked ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Liberado
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhuma consulta encontrada</h3>
            <p className="text-muted-foreground">
              Não foram encontradas consultas no período selecionado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}