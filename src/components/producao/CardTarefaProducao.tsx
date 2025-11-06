import { User, Clock, Eye, PackageCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CardTarefaProducaoProps {
  tarefa: {
    id: string;
    descricao: string;
    quantidade?: number;
    tempo_estimado?: number;
    hora_entrega?: string;
    cliente_nome?: string;
    receita_nome?: string;
    produto_nome?: string;
    concluida: boolean;
  };
  onMarcarProduzido: (tarefaId: string) => void;
  onVerReceita?: (tarefaId: string) => void;
  isLoading?: boolean;
}

export function CardTarefaProducao({ 
  tarefa, 
  onMarcarProduzido, 
  onVerReceita,
  isLoading = false 
}: CardTarefaProducaoProps) {
  const formatarTempo = (minutos?: number) => {
    if (!minutos) return null;
    if (minutos < 60) {
      return `${Math.round(minutos)}min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  const formatarHorario = (hora?: string) => {
    if (!hora) return null;
    return hora.slice(0, 5); // HH:mm
  };

  return (
    <Card className={tarefa.concluida ? "opacity-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={tarefa.concluida}
            disabled={tarefa.concluida || isLoading}
            onCheckedChange={() => onMarcarProduzido(tarefa.id)}
            className="mt-1"
          />

          {/* Conteúdo */}
          <div className="flex-1 space-y-2">
            {/* Título */}
            <h4 className="font-semibold text-foreground">{tarefa.descricao}</h4>

            {/* Subtítulo - Cliente */}
            {tarefa.cliente_nome && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{tarefa.cliente_nome}</span>
              </div>
            )}

            {/* Hora de entrega */}
            {tarefa.hora_entrega && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatarHorario(tarefa.hora_entrega)}</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {tarefa.tempo_estimado && (
                <Badge variant="secondary" className="text-xs">
                  {formatarTempo(tarefa.tempo_estimado)}
                </Badge>
              )}
              {tarefa.receita_nome && (
                <Badge variant="outline" className="text-xs">
                  <PackageCheck className="h-3 w-3 mr-1" />
                  {tarefa.receita_nome}
                </Badge>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              {onVerReceita && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onVerReceita(tarefa.id)}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Receita
                </Button>
              )}
              {!tarefa.concluida && (
                <Button
                  size="sm"
                  onClick={() => onMarcarProduzido(tarefa.id)}
                  disabled={isLoading}
                >
                  Marcar Produzido
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
