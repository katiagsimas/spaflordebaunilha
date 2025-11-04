import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Package2 } from "lucide-react";
import type { Item, TipoItem, UnidadeBase } from "@/types/estoque";

interface ModalItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
  onSave: (item: Partial<Item>) => Promise<{ success: boolean }>;
}

const UNIDADES: UnidadeBase[] = ['g', 'kg', 'ml', 'l', 'un', 'caixa', 'pct'];

export function ModalItem({ open, onOpenChange, item, onSave }: ModalItemProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Item>>({
    tipo: item?.tipo || 'ingrediente',
    categoria: item?.categoria || '',
    nome: item?.nome || '',
    descricao: item?.descricao || '',
    unidade_base: item?.unidade_base || 'g',
    quantidade_por_embalagem: item?.quantidade_por_embalagem || 1,
    rastrear_estoque: item?.rastrear_estoque || false,
    ponto_de_pedido: item?.ponto_de_pedido,
    localizacao: item?.localizacao || '',
    fornecedor_padrao: item?.fornecedor_padrao || '',
    observacoes: item?.observacoes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onSave(formData);
      if (result.success) {
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Farináceos, Laticínios..."
              />
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

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Detalhes adicionais sobre o item..."
              rows={2}
            />
          </div>

          {/* Unidade e Quantidade por Embalagem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unidade_base">Unidade Base *</Label>
              <Select
                value={formData.unidade_base}
                onValueChange={(value: UnidadeBase) => setFormData({ ...formData, unidade_base: value })}
              >
                <SelectTrigger id="unidade_base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map(un => (
                    <SelectItem key={un} value={un}>{un}</SelectItem>
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

          {/* Controle de Estoque */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rastrear_estoque" className="text-base">
                  Rastrear Estoque
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ativar controle de estoque para este item
                </p>
              </div>
              <Switch
                id="rastrear_estoque"
                checked={formData.rastrear_estoque}
                onCheckedChange={(checked) => setFormData({ ...formData, rastrear_estoque: checked })}
              />
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

          {/* Fornecedor Padrão */}
          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor Padrão</Label>
            <Input
              id="fornecedor"
              value={formData.fornecedor_padrao}
              onChange={(e) => setFormData({ ...formData, fornecedor_padrao: e.target.value })}
              placeholder="Nome do fornecedor preferencial"
            />
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
