import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCategoriasEstoque } from '@/hooks/useCategoriasEstoque';
import type { TipoItem } from '@/types/estoque';

interface NovoItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoItem;
  nomeInicial?: string;
  onSuccess?: (item: any) => void;
}

export function NovoItemDialog({ 
  open, 
  onOpenChange, 
  tipo, 
  nomeInicial = '',
  onSuccess 
}: NovoItemDialogProps) {
  const { categorias } = useCategoriasEstoque();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [descricao, setDescricao] = useState(nomeInicial);
  const [quantidade, setQuantidade] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [categoriaEstoqueId, setCategoriaEstoqueId] = useState('');
  const [controlarEstoque, setControlarEstoque] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setDescricao(nomeInicial);
      fetchUnidades();
    }
  }, [open, nomeInicial]);

  const fetchUnidades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('unidades_medida')
        .select('id, nome, sigla')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  const handleSalvar = async () => {
    if (!descricao || !quantidade || !unidadeId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSalvando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_insumos')
        .insert({
          usuario_id: user.id,
          tipo: tipo,
          descricao: descricao,
          quantidade_embalagem: parseFloat(quantidade),
          unidade_medida_id: unidadeId,
          categoria_estoque_id: categoriaEstoqueId || null,
        })
        .select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            sigla
          )
        `)
        .single();

      if (error) throw error;

      toast.success(`${tipo === 'ingrediente' ? 'Ingrediente' : 'Embalagem'} cadastrado com sucesso!`);
      
      if (onSuccess && data) {
        onSuccess(data);
      }
      
      limparFormulario();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao cadastrar item');
    } finally {
      setSalvando(false);
    }
  };

  const limparFormulario = () => {
    setDescricao('');
    setQuantidade('');
    setUnidadeId('');
    setCategoriaEstoqueId('');
    setControlarEstoque(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Novo {tipo === 'ingrediente' ? 'Ingrediente' : 'Embalagem'}
          </DialogTitle>
          <DialogDescription>
            Cadastre o tipo base {tipo === 'ingrediente' ? 'do ingrediente' : 'da embalagem'} com sua quantidade padrão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">
              Nome {tipo === 'ingrediente' ? 'do Ingrediente' : 'da Embalagem'} *
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={tipo === 'ingrediente' ? 'Ex: Farinha de Trigo' : 'Ex: Caixa de Papelão'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Qtde na Embalagem *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade de Medida *</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger id="unidade">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome} ({unidade.sigla})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria de Estoque</Label>
            <Select value={categoriaEstoqueId} onValueChange={setCategoriaEstoqueId}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categorias
                  .filter(cat => cat.ativo)
                  .map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.icone && <span className="mr-2">{categoria.icone}</span>}
                      {categoria.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="controlar"
              checked={controlarEstoque}
              onCheckedChange={(checked) => setControlarEstoque(checked as boolean)}
            />
            <Label htmlFor="controlar" className="cursor-pointer">
              Controle de Estoque
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
