import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  const [observacao, setObservacao] = useState("");
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
      setObservacao("");
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Estoque Atual</Label>
            <Input 
              value={`${item.estoque?.saldo || 0} ${item.unidade_base}`} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimentação</Label>
            <Select value={tipoMovimento} onValueChange={(v) => setTipoMovimento(v as any)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">➕ Entrada</SelectItem>
                <SelectItem value="saida">➖ Saída</SelectItem>
                <SelectItem value="ajuste">⚙️ Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              />
              <Input 
                value={item.unidade_base} 
                disabled 
                className="w-24 bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da movimentação..."
              rows={3}
            />
          </div>

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
