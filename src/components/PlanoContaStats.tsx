import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { TrendingUp, Clock, Edit } from "lucide-react";

interface PlanoConta {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  usoCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface PlanoContaStatsProps {
  planos: PlanoConta[];
  isOpen: boolean;
  onClose: () => void;
}

export function PlanoContaStats({ planos, isOpen, onClose }: PlanoContaStatsProps) {
  // Ordenar por uso (placeholder - será real quando houver lançamentos)
  const maisUsados = [...planos]
    .sort((a, b) => (b.usoCount || 0) - (a.usoCount || 0))
    .slice(0, 10);

  // Recém criados
  const recentes = [...planos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recém editados
  const editados = [...planos]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas dos Planos de Contas
          </DialogTitle>
          <DialogDescription>
            Análise de uso e atividade dos planos de contas
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mais Usados
            </h3>
            <div className="space-y-2">
              {maisUsados.map((plano, index) => (
                <div key={plano.id} className="text-sm">
                  <span className="font-medium">{index + 1}.</span> {plano.nome}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({plano.usoCount || 0} usos)
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recém Criados
            </h3>
            <div className="space-y-2">
              {recentes.map((plano) => (
                <div key={plano.id} className="text-sm">
                  {plano.nome}
                  <div className="text-xs text-muted-foreground">
                    {new Date(plano.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Recém Editados
            </h3>
            <div className="space-y-2">
              {editados.map((plano) => (
                <div key={plano.id} className="text-sm">
                  {plano.nome}
                  <div className="text-xs text-muted-foreground">
                    {new Date(plano.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4 bg-muted/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{planos.length}</div>
              <div className="text-xs text-muted-foreground">Total de Planos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {planos.filter(p => p.tipo === 'receita').length}
              </div>
              <div className="text-xs text-muted-foreground">Receitas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {planos.filter(p => p.tipo === 'despesa').length}
              </div>
              <div className="text-xs text-muted-foreground">Despesas</div>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
