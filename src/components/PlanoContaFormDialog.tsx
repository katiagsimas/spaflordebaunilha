import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Smile } from "lucide-react";

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone: string;
  ativo: boolean;
}

interface FormData {
  nome: string;
  descricao: string;
  categoriaId: string;
  tipo: 'receita' | 'despesa';
  ativo: boolean;
  iconeCustomizado: string;
  corCustomizada: string;
}

interface PlanoContaFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  categorias: CategoriaFinanceira[];
  editingPlanoConta: any | null;
}

const iconesComuns = ['💰', '📊', '💳', '🏦', '💵', '📈', '📉', '🛒', '🏠', '⚡', '💡', '📱', '🚗', '🍔', '👔', '🎓'];

export function PlanoContaFormDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  categorias,
  editingPlanoConta
}: PlanoContaFormDialogProps) {
  const categoriasReceitas = categorias.filter(c => c.tipo === 'receita' && c.ativo);
  const categoriasDespesas = categorias.filter(c => c.tipo === 'despesa' && c.ativo);

  const handleCategoriaChange = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (categoria) {
      setFormData(prev => ({
        ...prev,
        categoriaId,
        tipo: categoria.tipo,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPlanoConta ? 'Editar Plano de Contas' : 'Novo Plano de Contas'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do plano de contas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select 
              value={formData.categoriaId} 
              onValueChange={handleCategoriaChange}
              required
            >
              <SelectTrigger className="bg-background z-50">
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectGroup>
                  <SelectLabel className="text-success">🟢 Receitas</SelectLabel>
                  {categoriasReceitas.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        {cat.icone} {cat.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-destructive">🔴 Despesas</SelectLabel>
                  {categoriasDespesas.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        {cat.icone} {cat.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {formData.categoriaId && (
              <p className="text-xs text-muted-foreground">
                {categorias.find(c => c.id === formData.categoriaId)?.icone}{' '}
                {categorias.find(c => c.id === formData.categoriaId)?.nome}
              </p>
            )}
          </div>

          {/* Tipo (readonly) */}
          {formData.categoriaId && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div>
                <Badge 
                  variant={formData.tipo === 'receita' ? 'default' : 'destructive'}
                  className={formData.tipo === 'receita' ? 'bg-success hover:bg-success' : ''}
                >
                  {formData.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Preenchido automaticamente pela categoria
                </p>
              </div>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Plano de Contas *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Água, Luz, Internet, Receitas com Produtos"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              Máximo 100 caracteres
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Conta de água da Sabesp, Receitas de encomendas especiais"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 200 caracteres
            </p>
          </div>

          {/* Ícone Personalizado */}
          <div className="space-y-2">
            <Label htmlFor="icone" className="flex items-center gap-2">
              <Smile className="h-4 w-4" />
              Ícone Personalizado (opcional)
            </Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {iconesComuns.map(icone => (
                <Button
                  key={icone}
                  type="button"
                  variant={formData.iconeCustomizado === icone ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, iconeCustomizado: icone }))}
                  className="text-lg w-10 h-10 p-0"
                >
                  {icone}
                </Button>
              ))}
            </div>
            <Input
              id="icone"
              value={formData.iconeCustomizado}
              onChange={(e) => setFormData(prev => ({ ...prev, iconeCustomizado: e.target.value }))}
              placeholder="Ou digite um emoji..."
              maxLength={10}
            />
          </div>

          {/* Cor Personalizada */}
          <div className="space-y-2">
            <Label htmlFor="cor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor Personalizada (opcional)
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="cor"
                type="color"
                value={formData.corCustomizada || '#000000'}
                onChange={(e) => setFormData(prev => ({ ...prev, corCustomizada: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                value={formData.corCustomizada}
                onChange={(e) => setFormData(prev => ({ ...prev, corCustomizada: e.target.value }))}
                placeholder="#000000"
                className="flex-1"
              />
              {formData.corCustomizada && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, corCustomizada: '' }))}
                >
                  Limpar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Se não definir, será usada a cor da categoria
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, ativo: checked as boolean }))
                }
              />
              <Label 
                htmlFor="ativo" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Plano ativo
              </Label>
              <span 
                className="text-muted-foreground cursor-help text-sm" 
                title="Planos inativos não aparecem em novos lançamentos"
              >
                ⓘ
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Planos inativos não aparecem em novos lançamentos
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingPlanoConta ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
