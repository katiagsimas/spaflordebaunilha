import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface NovaSaidaSimplesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemSelecionado?: any;
  onSuccess: () => void;
  onRegistrarMovimentacao: (dados: any) => Promise<{ success: boolean }>;
}

export function NovaSaidaSimples({ 
  open, 
  onOpenChange, 
  itemSelecionado, 
  onSuccess,
  onRegistrarMovimentacao 
}: NovaSaidaSimplesProps) {
  const [dataSaida, setDataSaida] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState("Produção");
  const [quantidade, setQuantidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemSelecionado || !quantidade) return;
    
    const qtd = parseFloat(quantidade);

    // Validar quantidade disponível
    const saldoAtual = itemSelecionado.estoque?.saldo || 0;
    if (qtd > saldoAtual) {
      toast({
        title: "Quantidade indisponível",
        description: `Você tem apenas ${saldoAtual} ${itemSelecionado.unidade_base} disponíveis`,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const result = await onRegistrarMovimentacao({
        item_id: itemSelecionado.id,
        tipo: 'SAIDA',
        quantidade: qtd,
        data: dataSaida,
        motivo: motivo,
        observacoes: observacoes || null,
      });

      if (result.success) {
        onSuccess();
        onOpenChange(false);
        
        // Limpar formulário
        setQuantidade("");
        setObservacoes("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>➖ Saída de Estoque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Informações da Saída</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataSaida">Data *</Label>
                <Input
                  id="dataSaida"
                  type="date"
                  value={dataSaida}
                  onChange={(e) => setDataSaida(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="motivo">Motivo *</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger id="motivo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produção">Produção</SelectItem>
                    <SelectItem value="Perda/Quebra">Perda/Quebra</SelectItem>
                    <SelectItem value="Venda Direta">Venda Direta</SelectItem>
                    <SelectItem value="Uso Pessoal">Uso Pessoal</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {itemSelecionado && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Item Selecionado</h3>
              <p className="text-sm text-muted-foreground">{itemSelecionado.nome}</p>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Estoque Atual: </span>
                  {itemSelecionado.estoque?.saldo || 0} {itemSelecionado.unidade_base}
                </p>
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade *</Label>
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
                  <span className="text-sm text-muted-foreground self-center">
                    {itemSelecionado.unidade_base}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a saída"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Saída"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
