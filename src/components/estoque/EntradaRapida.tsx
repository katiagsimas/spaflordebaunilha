import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ItemComEstoque } from "@/types/estoque";

interface EntradaRapidaProps {
  item: ItemComEstoque;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<{ success: boolean }>;
}

export function EntradaRapida({ item, open, onOpenChange, onSave }: EntradaRapidaProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantidade: 0,
    valor_total: 0,
    atualizar_preco: true,
    nota_fiscal: '',
    observacao: ''
  });

  const novoPrecoUnitario = formData.quantidade > 0 
    ? (formData.valor_total / formData.quantidade).toFixed(4)
    : '0';

  const precoAtual = item.preco_ativo?.custo_unitario?.toFixed(4) || '0';
  const diferencaPreco = Number(novoPrecoUnitario) - Number(precoAtual);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onSave({
        movimento: {
          item_id: item.id,
          tipo: 'entrada',
          subtipo: 'compra',
          quantidade: formData.quantidade,
          custo_unitario: Number(novoPrecoUnitario),
          observacao: formData.observacao,
          data: new Date().toISOString()
        },
        preco: formData.atualizar_preco && Number(novoPrecoUnitario) > 0 ? {
          marca: item.preco_ativo?.marca || 'Sem marca',
          fornecedor: item.fornecedor_padrao || '',
          preco_total_embalagem: formData.valor_total,
          quantidade_embalagem: formData.quantidade,
          ativo: true
        } : null
      });

      if (result.success) {
        setFormData({
          quantidade: 0,
          valor_total: 0,
          atualizar_preco: true,
          nota_fiscal: '',
          observacao: ''
        });
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>➕ Entrada Rápida</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {/* Info do Item */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="font-semibold">{item.nome}</div>
              <div className="text-xs text-muted-foreground">
                {item.preco_ativo?.marca || 'Sem marca cadastrada'}
              </div>
            </div>

            {/* Quantidade e Valor - Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantidade" className="text-sm">Quantidade *</Label>
                <div className="flex gap-2">
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.01"
                    value={formData.quantidade || ''}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    required
                    className="w-full"
                  />
                  <div className="flex items-center px-2 bg-muted rounded-md text-xs font-medium">
                    {item.unidade_base}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="valor_total" className="text-sm">Valor Total *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  value={formData.valor_total || ''}
                  onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Comparação de Preços */}
            {formData.quantidade > 0 && formData.valor_total > 0 && (
              <Alert className="py-3">
                <AlertDescription>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">💡 Atual:</span>
                      <span className="font-mono font-semibold">
                        R$ {precoAtual}/{item.unidade_base}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Novo:</span>
                      <span className={`font-mono font-semibold flex items-center gap-1 ${
                        diferencaPreco > 0 ? 'text-red-600' : diferencaPreco < 0 ? 'text-emerald-600' : ''
                      }`}>
                        {diferencaPreco > 0 ? <TrendingUp className="h-3 w-3" /> : diferencaPreco < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        R$ {novoPrecoUnitario}/{item.unidade_base}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label htmlFor="atualizar_preco" className="text-xs cursor-pointer">
                        Atualizar preço
                      </Label>
                      <Switch
                        id="atualizar_preco"
                        checked={formData.atualizar_preco}
                        onCheckedChange={(checked) => setFormData({ ...formData, atualizar_preco: checked })}
                      />
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Campos Opcionais Compactos */}
            <div className="space-y-1.5">
              <Label htmlFor="nota_fiscal" className="text-sm">N° Nota Fiscal</Label>
              <Input
                id="nota_fiscal"
                value={formData.nota_fiscal}
                onChange={(e) => setFormData({ ...formData, nota_fiscal: e.target.value })}
                placeholder="Ex: 123456"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacao" className="text-sm">Observação</Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Informações adicionais..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Botões Fixos */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              size="sm"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} size="sm">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              💾 Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
