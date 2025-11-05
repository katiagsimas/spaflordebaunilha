import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Package2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Item, TipoItem, ItemComEstoque } from "@/types/estoque";
import { useCategoriasEstoque } from "@/hooks/useCategoriasEstoque";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";

interface ModalItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemComEstoque;
  onSave: (item: Partial<Item>) => Promise<{ success: boolean }>;
}

export function ModalItem({ open, onOpenChange, item, onSave }: ModalItemProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { categorias } = useCategoriasEstoque();
  const { unidades } = useUnidadesMedida();
  const [formData, setFormData] = useState<Partial<Item>>({
    tipo: item?.tipo || 'ingrediente',
    categoria: item?.categoria || '',
    nome: item?.nome || '',
    marca: item?.marca || '',
    unidade_base: item?.unidade_base || 'g',
    quantidade_por_embalagem: item?.quantidade_por_embalagem || 1,
    rastrear_estoque: item?.rastrear_estoque || false,
    ponto_de_pedido: item?.ponto_de_pedido,
    localizacao: item?.localizacao || '',
    observacoes: item?.observacoes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      if (item?.id) {
        // Atualizar item existente
        const { error } = await supabase
          .from('itens')
          .update({
            ...formData,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: "Item atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Criar novo item - validar campos obrigatórios
        if (!formData.nome || !formData.tipo || !formData.unidade_base || formData.rastrear_estoque === undefined) {
          toast({
            title: "Erro",
            description: "Preencha todos os campos obrigatórios",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('itens')
          .insert([{
            nome: formData.nome,
            tipo: formData.tipo,
            marca: formData.marca,
            unidade_base: formData.unidade_base,
            quantidade_por_embalagem: formData.quantidade_por_embalagem || 1,
            categoria: formData.categoria,
            rastrear_estoque: formData.rastrear_estoque,
            ponto_de_pedido: formData.ponto_de_pedido,
            localizacao: formData.localizacao,
            observacoes: formData.observacoes,
            usuario_id: user.id,
            ativo: true,
          }]);

        if (error) throw error;

        toast({
          title: "Item criado!",
          description: `${formData.nome} foi adicionado ao catálogo.`,
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o item",
        variant: "destructive",
      });
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
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
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Farinha de Trigo, Caixa de Papelão..."
              required
            />
          </div>

          {/* Marca */}
          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              placeholder="Ex: Nestlé, Embare..."
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

          {/* Informações de Estoque - Se for edição */}
          {item && item.rastrear_estoque && item.estoque && (
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">📊 Informações de Estoque</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Saldo Atual</div>
                    <div className="font-semibold font-mono">
                      {item.estoque.saldo.toFixed(2)} {item.unidade_base}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Valor em Estoque</div>
                    <div className="font-semibold font-mono">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.estoque.valor_estoque)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Para ajustar o saldo, use "Movimentação de Estoque" ou registre uma entrada/saída.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Controle de Estoque */}
          <div className="border-2 border-primary/30 rounded-lg p-5 space-y-4 bg-primary/5">
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">
                Rastrear Estoque *
              </Label>
              <p className="text-sm text-muted-foreground">
                Escolha se deseja controlar o estoque deste item
              </p>
              
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="rastrear_sim"
                    checked={formData.rastrear_estoque === true}
                    onCheckedChange={() => setFormData({ ...formData, rastrear_estoque: true })}
                    className="h-5 w-5"
                    disabled={!!item}
                  />
                  <Label htmlFor="rastrear_sim" className="font-medium cursor-pointer flex-1">
                    Sim - Controlar estoque
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="rastrear_nao"
                    checked={formData.rastrear_estoque === false}
                    onCheckedChange={() => setFormData({ ...formData, rastrear_estoque: false })}
                    className="h-5 w-5"
                    disabled={!!item}
                  />
                  <Label htmlFor="rastrear_nao" className="font-medium cursor-pointer flex-1">
                    Não - Apenas catalogar
                  </Label>
                </div>
              </div>
              
              {item && (
                <Alert>
                  <AlertDescription className="text-xs">
                    Não é possível alterar o rastreamento de estoque de um item já cadastrado.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {formData.rastrear_estoque && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="ponto_pedido">Ponto de Pedido</Label>
                  <Input
                    id="ponto_pedido"
                    type="number"
                    step="0.01"
                    value={formData.ponto_de_pedido || ''}
                    onChange={(e) => setFormData({ ...formData, ponto_de_pedido: parseFloat(e.target.value) || undefined })}
                    placeholder="Quantidade mínima"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                    placeholder="Ex: Prateleira A2"
                  />
                </div>
              </div>
            )}
          </div>

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
