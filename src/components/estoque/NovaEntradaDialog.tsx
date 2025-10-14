import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const entradaSchema = z.object({
  quantidade: z.number().positive({ message: "Quantidade deve ser positiva" }).max(999999, { message: "Quantidade muito grande" }),
  custoTotal: z.number().positive({ message: "Custo deve ser positivo" }).max(9999999, { message: "Custo muito grande" }),
  localCompra: z.string().max(200, { message: "Local muito longo (máx 200 caracteres)" }).optional(),
  observacoes: z.string().max(1000, { message: "Observações muito longas (máx 1000 caracteres)" }).optional(),
  dataCompra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" })
});

interface NovaEntradaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemSelecionado?: any;
  onSuccess?: () => void;
}

export function NovaEntradaDialog({ open, onOpenChange, itemSelecionado, onSuccess }: NovaEntradaDialogProps) {
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [localCompra, setLocalCompra] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [custoTotal, setCustoTotal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Validar com zod
      const validated = entradaSchema.parse({
        quantidade: parseFloat(quantidade),
        custoTotal: parseFloat(custoTotal),
        localCompra: localCompra || undefined,
        observacoes: observacoes || undefined,
        dataCompra
      });

      const qtd = validated.quantidade;
      const custo = validated.custoTotal;
      const custoUnitario = custo / qtd;

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar movimentação
      const { data: movimentacao, error: errorMov } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          data: dataCompra,
          tipo: 'ENTRADA',
          item_id: itemSelecionado?.id,
          tipo_item: itemSelecionado?.tipo_item || 'INSUMO',
          quantidade: qtd,
          unidade: itemSelecionado?.unidade || 'un',
          custo_unitario: custoUnitario,
          custo_total: custo,
          motivo: 'Compra',
          local_compra: validated.localCompra || null,
          observacoes: validated.observacoes || null,
          usuario_id: user.id
        })
        .select()
        .single();

      if (errorMov) throw errorMov;

      // Criar entrada detalhada para FIFO
      const { error: errorEntrada } = await supabase
        .from('entradas_detalhadas')
        .insert({
          movimentacao_entrada_id: movimentacao.id,
          item_id: itemSelecionado?.id,
          tipo_item: itemSelecionado?.tipo_item || 'INSUMO',
          data_entrada: dataCompra,
          quantidade_inicial: qtd,
          quantidade_restante: qtd,
          custo_unitario: custoUnitario,
          status: 'ATIVO',
          usuario_id: user.id
        });

      if (errorEntrada) throw errorEntrada;

      // Atualizar estoque_atual
      const { data: estoqueAtual } = await supabase
        .from('estoque_atual')
        .select('*')
        .eq('item_id', itemSelecionado?.id)
        .eq('tipo_item', itemSelecionado?.tipo_item || 'INSUMO')
        .maybeSingle();

      if (estoqueAtual) {
        // Atualizar
        const novaQtd = (estoqueAtual.quantidade_atual || 0) + qtd;
        const novoValorTotal = (estoqueAtual.valor_total || 0) + custo;
        const novoCustoMedio = novoValorTotal / novaQtd;

        await supabase
          .from('estoque_atual')
          .update({
            quantidade_atual: novaQtd,
            custo_medio: novoCustoMedio,
            valor_total: novoValorTotal,
            ultima_atualizacao: new Date().toISOString(),
          })
          .eq('item_id', itemSelecionado?.id)
          .eq('tipo_item', itemSelecionado?.tipo_item || 'INSUMO');
      } else {
        // Criar
        await supabase
          .from('estoque_atual')
          .insert({
            item_id: itemSelecionado?.id,
            tipo_item: itemSelecionado?.tipo_item || 'INSUMO',
            quantidade_atual: qtd,
            custo_medio: custoUnitario,
            valor_total: custo,
            usuario_id: user.id
          });
      }

      toast({
        title: "Entrada registrada!",
        description: "Estoque atualizado com sucesso",
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Limpar formulário
      setQuantidade("");
      setCustoTotal("");
      setLocalCompra("");
      setObservacoes("");
    } catch (error: any) {
      console.error('Erro ao registrar entrada:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Dados inválidos",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao registrar entrada",
          description: error.message,
          variant: "destructive",
        });
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
                      step="0.001"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      placeholder="0"
                      required
                    />
                    <Input
                      value={itemSelecionado.unidade}
                      disabled
                      className="w-20"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="custoTotal">Custo Total *</Label>
                  <Input
                    id="custoTotal"
                    type="number"
                    step="0.01"
                    value={custoTotal}
                    onChange={(e) => setCustoTotal(e.target.value)}
                    placeholder="R$ 0,00"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Custo Unitário: R$ {custoUnitario}/{itemSelecionado.unidade}
                  </p>
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
              placeholder="Ex: Promoção do atacado, nota fiscal #12345"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "✓ Registrar Entrada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
