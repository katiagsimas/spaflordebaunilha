import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const saidaSchema = z.object({
  quantidade: z.number().positive({ message: "Quantidade deve ser positiva" }).max(999999, { message: "Quantidade muito grande" }),
  observacoes: z.string().max(1000, { message: "Observações muito longas (máx 1000 caracteres)" }).optional(),
  dataSaida: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
  motivo: z.string().max(100, { message: "Motivo muito longo" })
});

interface NovaSaidaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemSelecionado?: any;
  onSuccess?: () => void;
}

export function NovaSaidaDialog({ open, onOpenChange, itemSelecionado, onSuccess }: NovaSaidaDialogProps) {
  const [dataSaida, setDataSaida] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState("Produção");
  const [quantidade, setQuantidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Validar com zod
      const validated = saidaSchema.parse({
        quantidade: parseFloat(quantidade),
        observacoes: observacoes || undefined,
        dataSaida,
        motivo
      });

      const qtd = validated.quantidade;

      // Validar quantidade disponível
      if (qtd > itemSelecionado?.quantidade_atual) {
        toast({
          title: "Quantidade indisponível",
          description: `Você tem apenas ${itemSelecionado?.quantidade_atual} ${itemSelecionado?.unidade} disponíveis`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Buscar entradas FIFO (mais antigas primeiro)
      const { data: entradas, error: errorEntradas } = await supabase
        .from('entradas_detalhadas')
        .select('*')
        .eq('item_id', itemSelecionado?.id)
        .eq('status', 'ATIVO')
        .gt('quantidade_restante', 0)
        .order('data_entrada', { ascending: true });

      if (errorEntradas) throw errorEntradas;

      // Calcular custo FIFO
      let quantidadeRestante = qtd;
      let custoTotal = 0;
      const entradasConsumidas: any[] = [];

      for (const entrada of entradas || []) {
        if (quantidadeRestante <= 0) break;

        const qtdConsumida = Math.min(entrada.quantidade_restante, quantidadeRestante);
        custoTotal += qtdConsumida * entrada.custo_unitario;
        
        entradasConsumidas.push({
          id: entrada.id,
          qtd_consumida: qtdConsumida,
          nova_qtd_restante: entrada.quantidade_restante - qtdConsumida,
        });

        quantidadeRestante -= qtdConsumida;
      }

      const custoUnitario = custoTotal / qtd;

      // Criar movimentação
      const { error: errorMov } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          data: dataSaida,
          tipo: 'SAIDA',
          item_id: itemSelecionado?.id,
          tipo_item: itemSelecionado?.tipo_item || 'INSUMO',
          quantidade: qtd,
          unidade: itemSelecionado?.unidade || 'un',
          custo_unitario: custoUnitario,
          custo_total: custoTotal,
          motivo: validated.motivo,
          observacoes: validated.observacoes || null,
        });

      if (errorMov) throw errorMov;

      // Atualizar entradas consumidas
      for (const entrada of entradasConsumidas) {
        await supabase
          .from('entradas_detalhadas')
          .update({
            quantidade_restante: entrada.nova_qtd_restante,
            status: entrada.nova_qtd_restante === 0 ? 'CONSUMIDO' : 'ATIVO',
          })
          .eq('id', entrada.id);
      }

      // Atualizar estoque_atual
      const novaQtd = itemSelecionado.quantidade_atual - qtd;
      const novoValorTotal = itemSelecionado.valor_total - custoTotal;

      await supabase
        .from('estoque_atual')
        .update({
          quantidade_atual: novaQtd,
          valor_total: novoValorTotal,
          ultima_atualizacao: new Date().toISOString(),
        })
        .eq('item_id', itemSelecionado?.id)
        .eq('tipo_item', itemSelecionado?.tipo_item || 'INSUMO');

      toast({
        title: "Saída registrada!",
        description: "Estoque atualizado com sucesso",
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Limpar formulário
      setQuantidade("");
      setObservacoes("");
    } catch (error: any) {
      console.error('Erro ao registrar saída:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Dados inválidos",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao registrar saída",
          description: error.message,
          variant: "destructive",
        });
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
              <p className="text-sm font-medium text-primary">
                💡 Disponível: {itemSelecionado.quantidade_atual} {itemSelecionado.unidade}
              </p>

              <div>
                <Label htmlFor="quantidade">Quantidade a Sair *</Label>
                <div className="flex gap-2">
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.001"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder="0"
                    max={itemSelecionado.quantidade_atual}
                    required
                  />
                  <Input
                    value={itemSelecionado.unidade}
                    disabled
                    className="w-20"
                  />
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
              placeholder="Ex: Bolo 3 andares para Maria Silva"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "✓ Registrar Saída"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
