import { Eye, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Benefit } from "@shared/schema";
import { formatCurrency, formatCPF, getStatusColor, getBenefitSpeciesName } from "@/lib/utils";

interface BenefitCardProps {
  benefit: Benefit;
  onViewDetails: (benefitNumber: string) => void;
}

export function BenefitCard({ benefit, onViewDetails }: BenefitCardProps) {
  const { Beneficiario, ResumoFinanceiro } = benefit;

  const handleViewDetails = () => {
    onViewDetails(Beneficiario.Beneficio);
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">{Beneficiario.Nome}</h3>
              <p className="text-sm text-muted-foreground">
                CPF: {formatCPF(Beneficiario.CPF)}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(Beneficiario.Situacao)}>
            {Beneficiario.Situacao}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Benefício</p>
            <p className="font-semibold text-foreground">{Beneficiario.Beneficio}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Espécie</p>
            <p className="font-semibold text-foreground">{Beneficiario.Especie}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {getBenefitSpeciesName(Beneficiario.Especie)}
            </p>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Margem Disponível</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(ResumoFinanceiro.MargemDisponivelEmprestimo)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor do Benefício</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(ResumoFinanceiro.ValorBeneficio)}
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleViewDetails}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
