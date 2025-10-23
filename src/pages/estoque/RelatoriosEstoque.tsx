import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

export default function RelatoriosEstoque() {
  const navigate = useNavigate();

  const relatorios = [
    {
      id: "movimentacoes",
      titulo: "Movimentações",
      descricao: "Entradas e saídas por período",
      icone: FileText,
      rota: "/estoque/relatorios/movimentacoes",
      disponivel: true,
    },
    {
      id: "consumo-medio",
      titulo: "Consumo Médio",
      descricao: "Análise de consumo e previsões",
      icone: TrendingUp,
      rota: "/estoque/relatorios/consumo-medio",
      disponivel: true,
    },
    {
      id: "cmv-global",
      titulo: "CMV Global",
      descricao: "Custo de Mercadoria Vendida",
      icone: DollarSign,
      rota: "/estoque/relatorios/cmv-global",
      disponivel: true,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Relatórios de Estoque"
        description="Selecione o relatório que deseja visualizar"
        actions={<BackButton to="/estoque" label="Voltar para Estoque" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatorios.map((relatorio) => {
          const IconeRelatorio = relatorio.icone;
          
          return (
            <Card key={relatorio.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <IconeRelatorio className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{relatorio.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {relatorio.descricao}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                {relatorio.disponivel ? (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(relatorio.rota)}
                  >
                    Ver Relatório
                  </Button>
                ) : (
                  <Button className="w-full" variant="secondary" disabled>
                    Em breve
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
