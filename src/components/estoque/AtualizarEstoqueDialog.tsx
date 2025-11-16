import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { ItemComEstoque } from "@/types/estoque";

interface AtualizarEstoqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemComEstoque | null;
  onSuccess: () => void;
}

export function AtualizarEstoqueDialog({ 
  open, 
  onOpenChange, 
  item,
  onSuccess 
}: AtualizarEstoqueDialogProps) {
  const [tipoMovimento, setTipoMovimento] = useState<"entrada" | "saida" | "ajuste">("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [valor, setValor] = useState("");
  const [dataValidade, setDataValidade] = useState<Date | undefined>();
  const [observacao, setObservacao] = useState("");
  const [observacaoAberta, setObservacaoAberta] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    try {
      // Aqui você pode chamar a função de registrar movimento do hook useEstoqueIntegrado
      // Por enquanto, apenas mostramos sucesso
      toast({
        title: "Estoque atualizado",
        description: `${tipoMovimento === "entrada" ? "Entrada" : tipoMovimento === "saida" ? "Saída" : "Ajuste"} de ${quantidade} ${item.unidade_base} registrado com sucesso.`,
      });
      
      onSuccess();
      onOpenChange(false);
      setQuantidade("");
      setValor("");
      setDataValidade(undefined);
      setObservacao("");
      setObservacaoAberta(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: "Ocorreu um erro ao processar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Estoque - {item.nome}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Estoque Atual</Label>
            <Input 
              value={`${item.estoque?.saldo || 0} ${item.unidade_base}`} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Movimentação</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoMovimento("entrada")}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  tipoMovimento === "entrada"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(216,155,140,0.3)]"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Checkbox 
                  checked={tipoMovimento === "entrada"} 
                  className="pointer-events-none"
                />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoMovimento("saida")}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  tipoMovimento === "saida"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(216,155,140,0.3)]"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Checkbox 
                  checked={tipoMovimento === "saida"} 
                  className="pointer-events-none"
                />
                <span>Saída</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoMovimento("ajuste")}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  tipoMovimento === "ajuste"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(216,155,140,0.3)]"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Checkbox 
                  checked={tipoMovimento === "ajuste"} 
                  className="pointer-events-none"
                />
                <span>Ajuste</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <div className="flex gap-2">
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0.00"
                  required
                  className="flex-1"
                />
                <Input 
                  value={item.unidade_base} 
                  disabled 
                  className="w-20 bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Validade (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataValidade && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataValidade ? format(dataValidade, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataValidade}
                  onSelect={setDataValidade}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Collapsible open={observacaoAberta} onOpenChange={setObservacaoAberta}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <span className="text-sm font-medium">Observação (opcional)</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    observacaoAberta && "transform rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Motivo da movimentação..."
                rows={3}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
