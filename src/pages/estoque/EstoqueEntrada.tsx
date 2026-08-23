import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { useEstoque } from '@/hooks/useEstoque';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BuscarProdutoRevenda } from '@/components/BuscarProdutoRevenda';
import { useQueryClient } from '@tanstack/react-query';
import type { InsumoImportado } from '@/lib/produtoRevenda';

export default function EstoqueEntrada() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGroup } = useGroup();
  const { registrarEntrada } = useEstoque();
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<'ingrediente' | 'embalagem'>('ingrediente');
  const [insumoId, setInsumoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [custoTotal, setCustoTotal] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState('');
  const [atualizarGlobal, setAtualizarGlobal] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Load insumos/embalagens — mesma fonte usada por Meu Cardápio
  const { data: ingredientes = [] } = useQuery({
    queryKey: ['ingredientes-estoque', activeGroup?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ingredientes')
        .select('id, marca, preco, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao, quantidade_embalagem, unidades_medida:unidade_medida_id(sigla))')
        .eq('owner_group_id', activeGroup?.id) as any;
      return (data || []).map((i: any) => ({
        id: i.id,
        nome: i.tipos_insumos?.descricao || 'Ingrediente',
        marca: i.marca || null,
        preco: Number(i.preco) || 0,
        quantidade_embalagem: Number(i.tipos_insumos?.quantidade_embalagem) || 0,
        sigla: i.tipos_insumos?.unidades_medida?.sigla || '',
      }));
    },
    enabled: !!activeGroup?.id && tipo === 'ingrediente',
  });

  const { data: embalagens = [] } = useQuery({
    queryKey: ['embalagens-estoque', activeGroup?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('embalagens')
        .select('id, marca, preco, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao, quantidade_embalagem, unidades_medida:unidade_medida_id(sigla))')
        .eq('owner_group_id', activeGroup?.id) as any;
      return (data || []).map((e: any) => ({
        id: e.id,
        nome: e.tipos_insumos?.descricao || 'Embalagem',
        marca: e.marca || null,
        preco: Number(e.preco) || 0,
        quantidade_embalagem: Number(e.tipos_insumos?.quantidade_embalagem) || 0,
        sigla: e.tipos_insumos?.unidades_medida?.sigla || '',
      }));
    },
    enabled: !!activeGroup?.id && tipo === 'embalagem',
  });

  const insumos: any[] = tipo === 'ingrediente' ? ingredientes : embalagens;

  const formatarPreco = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSelecionarInsumo = (id: string) => {
    setInsumoId(id);
    const item = insumos.find((i) => i.id === id);
    if (item) {
      setQuantidadeEmbalagem(String(item.quantidade_embalagem || ''));
      setPrecoProduto(String(item.preco || ''));
      
      // Auto-calcular custo total se tivermos quantidade comprada
      if (quantidade && item.preco > 0 && item.quantidade_embalagem > 0) {
        const total = (item.preco / item.quantidade_embalagem) * Number(quantidade);
        setCustoTotal(total.toFixed(2));
      } else if (item.preco > 0 && !quantidade) {
        // Se não tiver quantidade comprada ainda, assumimos 1 embalagem por padrão
        setQuantidade(String(item.quantidade_embalagem || 1));
        setCustoTotal(String(item.preco));
      }
    }
  };

  const calcularCustoTotal = (qtdComprada: string, precoEmb: string, qtdEmb: string) => {
    const qC = Number(qtdComprada);
    const pE = Number(precoEmb);
    const qE = Number(qtdEmb);
    if (qC > 0 && pE > 0 && qE > 0) {
      return (pE / qE) * qC;
    }
    return 0;
  };

  const handleQuantidadeCompradaChange = (val: string) => {
    setQuantidade(val);
    const total = calcularCustoTotal(val, precoProduto, quantidadeEmbalagem);
    if (total > 0) setCustoTotal(total.toFixed(2));
  };

  const handlePrecoProdutoChange = (val: string) => {
    setPrecoProduto(val);
    const total = calcularCustoTotal(quantidade, val, quantidadeEmbalagem);
    if (total > 0) setCustoTotal(total.toFixed(2));
  };

  const handleQuantidadeEmbalagemChange = (val: string) => {
    setQuantidadeEmbalagem(val);
    const total = calcularCustoTotal(quantidade, precoProduto, val);
    if (total > 0) setCustoTotal(total.toFixed(2));
  };

  const handleProdutoRevendaImportado = async (insumo: InsumoImportado) => {
    setTipo('ingrediente');
    await queryClient.invalidateQueries({ queryKey: ['ingredientes-estoque'] });
    setInsumoId(insumo.id);
    setQuantidadeEmbalagem(String(insumo.tipo_insumo.quantidade_embalagem || 1));
    setPrecoProduto(String(insumo.preco || ''));
    setQuantidade(String(insumo.tipo_insumo.quantidade_embalagem || 1));
    if (insumo.preco > 0) setCustoTotal(String(insumo.preco));
  };

  const custoUnitarioBase = Number(precoProduto) > 0 && Number(quantidadeEmbalagem) > 0 
    ? Number(precoProduto) / Number(quantidadeEmbalagem) 
    : 0;
  
  const insumoSelecionado = insumos.find(i => i.id === insumoId);
  const siglaUnidade = insumoSelecionado?.sigla || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoId || !quantidade || !custoTotal) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSalvando(true);
      
      // Se solicitado, atualizar preço global do insumo
      if (atualizarGlobal && insumoId) {
        const table = tipo === 'ingrediente' ? 'ingredientes' : 'embalagens';
        const { error: updateError } = await supabase
          .from(table)
          .update({ preco: Number(precoProduto) })
          .eq('id', insumoId);
        
        if (updateError) {
          console.error('Erro ao atualizar preço global:', updateError);
          toast.error('Entrada será registrada, mas houve erro ao atualizar preço global em Insumos.');
        } else {
          toast.success('Preço atualizado em Insumos/Fichas Técnicas.');
        }
      }

      await registrarEntrada({
        tipo,
        ingrediente_id: tipo === 'ingrediente' ? insumoId : undefined,
        embalagem_id: tipo === 'embalagem' ? insumoId : undefined,
        quantidade: Number(quantidade),
        custo_total: Number(custoTotal),
        observacao: observacao || undefined,
      });
      navigate('/estoque');
    } catch (err: any) {
      toast.error('Erro ao registrar entrada: ' + (err.message || ''));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Entrada de Estoque"
        description="Registre uma compra de insumo ou embalagem"
        backButton={<BackButton to="/estoque" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-body">Dados da Entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="rounded-lg border p-4">
              <BuscarProdutoRevenda
                onImportado={handleProdutoRevendaImportado}
                hint="Informe o código do produto Natura/Avon para trazer descrição e valor automaticamente para a entrada."
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Insumo *</Label>
              <Select value={tipo} onValueChange={(v) => { setTipo(v as any); setInsumoId(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingrediente">Insumo</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Insumo *</Label>
              <Select value={insumoId} onValueChange={handleSelecionarInsumo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o insumo" />
                </SelectTrigger>
                <SelectContent>
                  {insumos.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome}
                      {i.marca ? ` — ${i.marca}` : ''}
                      {i.preco > 0 ? ` · ${formatarPreco(i.preco)}` : ''}
                      {i.quantidade_embalagem > 0 ? ` / ${i.quantidade_embalagem}${i.sigla}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                As marcas e preços vêm de <strong>Meu Cardápio</strong>. Quantidade e custo são
                pré-preenchidos da embalagem cadastrada — você pode ajustar abaixo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Qtd na Embalagem *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantidadeEmbalagem}
                    onChange={(e) => handleQuantidadeEmbalagemChange(e.target.value)}
                    placeholder="Ex: 1000"
                  />
                  {siglaUnidade && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {siglaUnidade}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preço da Embalagem (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={precoProduto}
                  onChange={(e) => handlePrecoProdutoChange(e.target.value)}
                  placeholder="Ex: 49.02"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade Comprada *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantidade}
                    onChange={(e) => handleQuantidadeCompradaChange(e.target.value)}
                    placeholder="Ex: 100"
                  />
                  {siglaUnidade && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {siglaUnidade}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Custo Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={custoTotal}
                  onChange={(e) => setCustoTotal(e.target.value)}
                  placeholder="Ex: 4.90"
                />
              </div>
            </div>

            {custoUnitarioBase > 0 && (
              <div className="p-3 rounded-lg bg-sfb-baunilha border border-sfb-terracota/20">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-body text-sfb-cacau/70">
                    Custo unitário base: <strong>{custoUnitarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 })}</strong> por {siglaUnidade || 'unidade'}
                  </span>
                  <span className="text-xs font-body text-sfb-cacau/70">
                    Custo total da entrada: <strong>{Number(custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="atualizarGlobal"
                checked={atualizarGlobal}
                onChange={(e) => setAtualizarGlobal(e.target.checked)}
                className="h-4 w-4 rounded border-sfb-cacau/20 text-sfb-terracota focus:ring-sfb-terracota"
              />
              <Label htmlFor="atualizarGlobal" className="text-sm cursor-pointer text-sfb-cacau">
                Atualizar preço em Insumos, Pré-Preparo e Ficha Técnica?
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Compra no atacadão"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Registrar Entrada'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/estoque')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
