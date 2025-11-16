import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NovaEntradaSimplesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemSelecionado?: any;
  onSuccess: () => void;
  onRegistrarMovimentacao: (dados: any) => Promise<{ success: boolean }>;
}

export function NovaEntradaSimples({ 
  open, 
  onOpenChange, 
  itemSelecionado, 
  onSuccess,
  onRegistrarMovimentacao 
}: NovaEntradaSimplesProps) {
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [localCompra, setLocalCompra] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [custoTotal, setCustoTotal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemSelecionado || !quantidade || !custoTotal) return;
    
    setLoading(true);

    try {
      const qtd = parseFloat(quantidade);
      const custo = parseFloat(custoTotal);
      const custoUnitario = custo / qtd;

      const result = await onRegistrarMovimentacao({
        item_id: itemSelecionado.id,
        tipo: 'ENTRADA',
        quantidade: qtd,
        custo_unitario: custoUnitario,
        custo_total: custo,
        data: dataCompra,
        motivo: 'Compra',
        local_compra: localCompra || null,
        observacoes: observacoes || null,
      });

      if (result.success) {
        onSuccess();
        onOpenChange(false);
        
        // Limpar formulário
        setQuantidade("");
        setCustoTotal("");
        setLocalCompra("");
        setObservacoes("");
      }
    } finally {
      setLoading(false);
    }
  };

  const custoUnitario = quantidade && custoTotal 
    ? (parseFloat(custoTotal) / parseFloat(quantidade)).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>➕ Entrada de Estoque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Informações da Compra</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataCompra">Data da Compra *</Label>
                <Input
                  id="dataCompra"
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="localCompra">Local da Compra</Label>
                <Input
                  id="localCompra"
                  value={localCompra}
                  onChange={(e) => setLocalCompra(e.target.value)}
                  placeholder="Onde foi comprado"
                />
              </div>
            </div>
          </div>

          {itemSelecionado && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Item Selecionado</h3>
              <p className="text-sm text-muted-foreground">{itemSelecionado.nome}</p>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="custoTotal">Custo Total *</Label>
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground self-center">R$</span>
                    <Input
                      id="custoTotal"
                      type="number"
                      step="0.01"
                      value={custoTotal}
                      onChange={(e) => setCustoTotal(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Custo Unitário: </span>
                  R$ {custoUnitario} / {itemSelecionado.unidade_base}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a compra"
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
              {loading ? "Registrando..." : "Registrar Entrada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
