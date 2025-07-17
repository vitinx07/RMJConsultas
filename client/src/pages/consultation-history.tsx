import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatCPF } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Search, Clock, DollarSign, AlertCircle, Eye, Download } from "lucide-react";

interface Consultation {
  id: string;
  searchType: string;
  searchValue: string;
  cpf: string;
  benefitNumber: string;
  beneficiaryName: string;
  benefitValue: string;
  availableMargin: string;
  loanBlocked: boolean;
  blockReason: string;
  resultData: any;
  createdAt: string;
}

export default function ConsultationHistory() {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  const { data: consultations, isLoading, error } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredConsultations = consultations?.filter(consultation =>
    consultation.beneficiaryName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    consultation.cpf.includes(searchFilter.replace(/\D/g, "")) ||
    consultation.benefitNumber.includes(searchFilter)
  ) || [];

  const handleViewDetails = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
  };

  const handleDownloadReport = (consultation: Consultation) => {
    // Implementation for generating PDF report
    const data = JSON.stringify(consultation.resultData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consulta-${consultation.benefitNumber}-${consultation.createdAt.split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-20">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Erro ao carregar histórico de consultas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Consultas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as suas consultas anteriores
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {filteredConsultations.length} consultas
        </Badge>
      </div>

      {/* Search Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtrar Consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome, CPF ou número do benefício..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Consultation History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas Realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma consulta encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Benefício</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">
                        {formatDate(consultation.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">
                          {consultation.beneficiaryName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCPF(consultation.cpf)}
                      </TableCell>
                      <TableCell>
                        {consultation.benefitNumber}
                      </TableCell>
                      <TableCell>
                        {consultation.benefitValue 
                          ? formatCurrency(parseFloat(consultation.benefitValue))
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        {consultation.availableMargin 
                          ? formatCurrency(parseFloat(consultation.availableMargin))
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={consultation.loanBlocked ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {consultation.loanBlocked ? "Bloqueado" : "Liberado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {consultation.searchType === "cpf" ? "CPF" : "Benefício"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(consultation)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(consultation)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultation Details Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detalhes da Consulta</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConsultation(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Informações Básicas</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Beneficiário:</span> {selectedConsultation.beneficiaryName}
                    </div>
                    <div>
                      <span className="font-medium">CPF:</span> {formatCPF(selectedConsultation.cpf)}
                    </div>
                    <div>
                      <span className="font-medium">Benefício:</span> {selectedConsultation.benefitNumber}
                    </div>
                    <div>
                      <span className="font-medium">Data da Consulta:</span> {formatDate(selectedConsultation.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Tipo de Busca:</span> {selectedConsultation.searchType === "cpf" ? "CPF" : "Benefício"}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Dados Financeiros</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Valor do Benefício:</span> {
                        selectedConsultation.benefitValue 
                          ? formatCurrency(parseFloat(selectedConsultation.benefitValue))
                          : "N/A"
                      }
                    </div>
                    <div>
                      <span className="font-medium">Margem Disponível:</span> {
                        selectedConsultation.availableMargin 
                          ? formatCurrency(parseFloat(selectedConsultation.availableMargin))
                          : "N/A"
                      }
                    </div>
                    <div>
                      <span className="font-medium">Status do Empréstimo:</span> {
                        selectedConsultation.loanBlocked ? "Bloqueado" : "Liberado"
                      }
                    </div>
                    {selectedConsultation.loanBlocked && selectedConsultation.blockReason && (
                      <div>
                        <span className="font-medium">Motivo do Bloqueio:</span> {selectedConsultation.blockReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Dados Completos</h3>
                <div className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-60">
                  <pre>{JSON.stringify(selectedConsultation.resultData, null, 2)}</pre>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadReport(selectedConsultation)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Relatório
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedConsultation(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}