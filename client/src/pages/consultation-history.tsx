import { Navbar } from "@/components/navbar";
import { ConsultationHistory } from "@/components/ConsultationHistory";

export default function ConsultationHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Consultas</h1>
            <p className="text-muted-foreground">
              Visualize e exporte o histórico completo de consultas realizadas
            </p>
          </div>
          <ConsultationHistory />
        </div>
      </main>
    </div>
  );
}