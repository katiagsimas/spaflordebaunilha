import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface HistoricoAlteracao {
  data: string;
  acao: string;
  detalhes: string;
  usuario?: string;
}

interface PlanoConta {
  id: string;
  nome: string;
  historico?: HistoricoAlteracao[];
}

interface PlanoContaHistoryProps {
  plano: PlanoConta | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlanoContaHistory({ plano, isOpen, onClose }: PlanoContaHistoryProps) {
  if (!plano) return null;

  const historico = plano.historico || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico: {plano.nome}
          </DialogTitle>
          <DialogDescription>
            Registro de todas as alterações realizadas neste plano de contas
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((item, index) => (
                <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-foreground">{item.acao}</div>
                      <div className="text-sm text-muted-foreground mt-1">{item.detalhes}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.data).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
