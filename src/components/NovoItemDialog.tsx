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
  const [marca, setMarca] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');
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

      // Buscar o nome da categoria pelo ID
      let categoriaNome = null;
      if (categoriaEstoqueId) {
        const categoriaEncontrada = categorias.find(cat => cat.id === categoriaEstoqueId);
        categoriaNome = categoriaEncontrada?.nome || null;
      }

      // Criar o item
      const { data: itemData, error: itemError } = await supabase
        .from('itens')
        .insert({
          usuario_id: user.id,
          tipo: tipo,
          nome: descricao,
          unidade_base: unidadeId,
          quantidade_por_embalagem: parseFloat(quantidade),
          categoria: categoriaNome,
          rastrear_estoque: true,
          ponto_de_pedido: estoqueMinimo ? parseFloat(estoqueMinimo) : null,
          observacoes: observacoes || null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Criar o preço se marca foi informada
      if (marca) {
        const custoUnitario = valorEntrada && quantidadeEntrada 
          ? parseFloat(valorEntrada) / parseFloat(quantidadeEntrada)
          : 0;

        const { error: precoError } = await supabase
          .from('precos')
          .insert({
            item_id: itemData.id,
            usuario_id: user.id,
            marca: marca,
            preco_total_embalagem: valorEntrada ? parseFloat(valorEntrada) : 0,
            quantidade_embalagem: parseFloat(quantidade),
            custo_unitario: custoUnitario,
            ativo: true,
            data_coleta: new Date().toISOString(),
          });

        if (precoError) throw precoError;
      }

      // Registrar entrada de estoque se quantidade foi informada
      if (quantidadeEntrada && parseFloat(quantidadeEntrada) > 0) {
        const custoUnitario = valorEntrada && quantidadeEntrada 
          ? parseFloat(valorEntrada) / parseFloat(quantidadeEntrada)
          : 0;

        // Buscar a unidade para pegar a sigla
        const unidade = unidades.find(u => u.id === unidadeId);

        const { error: movError } = await supabase
          .from('movimentacoes_estoque')
          .insert({
            item_id: itemData.id,
            usuario_id: user.id,
            tipo: 'ENTRADA',
            tipo_item: tipo === 'ingrediente' ? 'INSUMO' : 'EMBALAGEM',
            quantidade: parseFloat(quantidadeEntrada),
            custo_unitario: custoUnitario,
            custo_total: valorEntrada ? parseFloat(valorEntrada) : 0,
            unidade: unidade?.sigla || 'un',
            data: new Date().toISOString(),
          });

        if (movError) throw movError;
      }

      toast.success('Item cadastrado');
      
      if (onSuccess && itemData) {
        onSuccess(itemData);
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
    setMarca('');
    setEstoqueMinimo('');
    setObservacoes('');
    setQuantidadeEntrada('');
    setValorEntrada('');
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
              <Label htmlFor="unidade">Unidade Base *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="quantidade">Qtde por Embalagem *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="1000"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Marca X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                step="0.01"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
            />
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
