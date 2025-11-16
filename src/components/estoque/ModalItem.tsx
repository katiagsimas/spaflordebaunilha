import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package2 } from "lucide-react";
import type { Item, TipoItem } from "@/types/estoque";
import { useCategoriasEstoque } from "@/hooks/useCategoriasEstoque";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { ItemNomeAutocomplete } from "@/components/ItemNomeAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ModalItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
  onSave: (item: Partial<Item>) => Promise<{ success: boolean }>;
}

export function ModalItem({ open, onOpenChange, item, onSave }: ModalItemProps) {
  const [loading, setLoading] = useState(false);
  const { categorias } = useCategoriasEstoque();
  const { unidades } = useUnidadesMedida();
  const [formData, setFormData] = useState<Partial<Item>>({
    tipo: 'ingrediente',
    categoria: '',
    nome: '',
    unidade_base: 'g',
    quantidade_por_embalagem: 1,
    rastrear_estoque: true,
    ponto_de_pedido: undefined,
    observacoes: '',
  });
  const [marca, setMarca] = useState('');
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');

  // Atualizar formData quando o item mudar ou o modal abrir
  useEffect(() => {
    if (open) {
      if (item) {
        // Modo edição - carregar dados do item
        setFormData({
          tipo: item.tipo || 'ingrediente',
          categoria: item.categoria || '',
          nome: item.nome || '',
          marca: item.marca || '',
          unidade_base: item.unidade_base || 'g',
          quantidade_por_embalagem: item.quantidade_por_embalagem || 1,
          rastrear_estoque: item.rastrear_estoque !== undefined ? item.rastrear_estoque : true,
          ponto_de_pedido: item.ponto_de_pedido,
          observacoes: item.observacoes || '',
        });
        setMarca(item.marca || '');
      } else {
        // Modo criação - limpar formulário
        setFormData({
          tipo: 'ingrediente',
          categoria: '',
          nome: '',
          marca: '',
          unidade_base: 'g',
          quantidade_por_embalagem: 1,
          rastrear_estoque: true,
          ponto_de_pedido: undefined,
          observacoes: '',
        });
        setMarca('');
        setQuantidadeEntrada('');
        setValorEntrada('');
      }
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onSave(formData);
      if (result.success) {
        // Se é um novo item e tem entrada de estoque
        if (!item && quantidadeEntrada && parseFloat(quantidadeEntrada) > 0) {
          // Buscar o item recém-criado para pegar o ID
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: novoItem } = await supabase
            .from('itens')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('nome', formData.nome)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (novoItem) {
            // Criar preço se marca foi informada
            if (marca) {
              const custoUnitario = valorEntrada && quantidadeEntrada 
                ? parseFloat(valorEntrada) / parseFloat(quantidadeEntrada)
                : 0;

              await supabase.from('precos').insert({
                item_id: novoItem.id,
                usuario_id: user.id,
                marca: marca,
                preco_total_embalagem: valorEntrada ? parseFloat(valorEntrada) : 0,
                quantidade_embalagem: formData.quantidade_por_embalagem || 1,
                custo_unitario: custoUnitario,
                ativo: true,
                data_coleta: new Date().toISOString(),
              });
            }

            // Registrar entrada de estoque
            const custoUnitario = valorEntrada && quantidadeEntrada 
              ? parseFloat(valorEntrada) / parseFloat(quantidadeEntrada)
              : 0;

            const { error: movError } = await supabase.from('movimentacoes_estoque').insert({
              item_id: novoItem.id,
              usuario_id: user.id,
              tipo: 'ENTRADA',
              tipo_item: formData.tipo === 'ingrediente' ? 'INSUMO' : 'EMBALAGEM',
              quantidade: parseFloat(quantidadeEntrada),
              custo_unitario: custoUnitario,
              custo_total: valorEntrada ? parseFloat(valorEntrada) : 0,
              unidade: formData.unidade_base || 'un',
              data: new Date().toISOString(),
            });

            if (movError) {
              console.error('Erro ao criar movimentação:', movError);
              toast({
                title: "Erro ao registrar entrada",
                description: movError.message,
                variant: "destructive"
              });
              return;
            }
          }
        }
        
        toast({
          title: "Item cadastrado",
          description: "O item foi salvo com sucesso e o estoque foi atualizado.",
        });
        
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            {item ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: TipoItem) => setFormData({ ...formData, tipo: value })}
                disabled={!!item}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingrediente">Ingrediente</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria de Estoque</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter(cat => cat.ativo)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.icone && <span className="mr-2">{cat.icone}</span>}
                        {cat.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Item *</Label>
            <ItemNomeAutocomplete
              value={formData.nome}
              tipo={formData.tipo as TipoItem}
              onSelect={(nome, tipoInsumoId, unidade, qtdEmbalagem) => {
                setFormData({
                  ...formData,
                  nome,
                  ...(unidade && { unidade_base: unidade as any }),
                  ...(qtdEmbalagem && { quantidade_por_embalagem: qtdEmbalagem }),
                });
              }}
              placeholder="Digite para buscar ou criar novo..."
            />
          </div>

          {/* Unidade e Quantidade por Embalagem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unidade_base">Unidade Base *</Label>
              <Select
                value={formData.unidade_base}
                onValueChange={(value: string) => setFormData({ ...formData, unidade_base: value as any })}
              >
                <SelectTrigger id="unidade_base">
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades
                    .filter(un => un.ativo)
                    .map(un => (
                      <SelectItem key={un.id} value={un.sigla}>
                        {un.nome} ({un.sigla})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtd_embalagem">Qtd. por Embalagem *</Label>
              <Input
                id="qtd_embalagem"
                type="number"
                step="0.01"
                value={formData.quantidade_por_embalagem}
                onChange={(e) => setFormData({ ...formData, quantidade_por_embalagem: parseFloat(e.target.value) })}
                placeholder="1000"
                required
              />
            </div>
          </div>

          {/* Marca e Estoque Mínimo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => {
                  setFormData({ ...formData, marca: e.target.value });
                  setMarca(e.target.value);
                }}
                placeholder="Ex: Marca X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ponto_pedido">Estoque Mínimo</Label>
              <Input
                id="ponto_pedido"
                type="number"
                step="0.01"
                value={formData.ponto_de_pedido || ''}
                onChange={(e) => setFormData({ ...formData, ponto_de_pedido: parseFloat(e.target.value) || undefined })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Entrada de Estoque */}
          {!item && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Entrada de Estoque</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidadeEntrada">Quantidade</Label>
                  <Input
                    id="quantidadeEntrada"
                    type="number"
                    step="0.01"
                    value={quantidadeEntrada}
                    onChange={(e) => setQuantidadeEntrada(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorEntrada">Valor</Label>
                  <Input
                    id="valorEntrada"
                    type="number"
                    step="0.01"
                    value={valorEntrada}
                    onChange={(e) => setValorEntrada(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>

          {/* Botões */}
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? 'Atualizar' : 'Criar'} Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
