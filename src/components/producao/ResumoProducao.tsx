import { CheckCircle2, Package, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ResumoProducaoProps {
  totalPedidos: number;
  totalItens: number;
  tempoTotal: number; // em minutos
}

export function ResumoProducao({ totalPedidos, totalItens, tempoTotal }: ResumoProducaoProps) {
  const formatarTempo = (minutos: number) => {
    if (minutos < 60) {
      return `${Math.round(minutos)}min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 - Pedidos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalPedidos}</p>
              <p className="text-sm text-muted-foreground">para hoje</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 - Itens */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalItens}</p>
              <p className="text-sm text-muted-foreground">a produzir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 - Tempo */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatarTempo(tempoTotal)}</p>
              <p className="text-sm text-muted-foreground">total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
