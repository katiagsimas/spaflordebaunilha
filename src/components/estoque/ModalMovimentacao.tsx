import { useState, useEffect } from 'react';
import { Search, Plus, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModalItem } from './ModalItem';
import type { ItemComEstoque } from '@/types/estoque';

interface ModalMovimentacaoProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
}

export function ModalMovimentacao({ aberto, onFechar, onSucesso }: ModalMovimentacaoProps) {
  const [busca, setBusca] = useState('');
  const [itemEncontrado, setItemEncontrado] = useState<ItemComEstoque | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const { toast } = useToast();

  // Buscar item ao digitar (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busca.length >= 3) {
        buscarItem();
      } else {
        setItemEncontrado(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  const buscarItem = async () => {
    try {
      setBuscando(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca por nome (case insensitive, busca parcial)
      const { data: itensData, error } = await supabase
        .from('itens')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .eq('rastrear_estoque', true)
        .ilike('nome', `%${busca}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (itensData) {
        // Buscar preço ativo
        const { data: precoData } = await supabase
          .from('precos')
          .select('*')
          .eq('item_id', itensData.id)
          .eq('ativo', true)
          .maybeSingle();

        // Buscar estoque
        const { data: estoqueData } = await supabase
          .from('estoque_atual_v2')
          .select('*')
          .eq('item_id', itensData.id)
          .maybeSingle();

        const itemCompleto: ItemComEstoque = {
          ...itensData,
          tipo: itensData.tipo as 'ingrediente' | 'embalagem',
          unidade_base: itensData.unidade_base as any,
          conversoes: itensData.conversoes as any,
          preco_ativo: precoData || undefined,
          estoque: estoqueData ? {
            item_id: estoqueData.item_id || '',
            usuario_id: estoqueData.usuario_id || '',
            nome: itensData.nome,
            tipo: itensData.tipo as 'ingrediente' | 'embalagem',
            categoria: itensData.categoria,
            unidade_base: itensData.unidade_base,
            ponto_de_pedido: itensData.ponto_de_pedido,
            saldo: estoqueData.saldo || 0,
            custo_medio: estoqueData.custo_medio || 0,
            valor_estoque: estoqueData.valor_estoque || 0,
            ultima_movimentacao: estoqueData.ultima_movimentacao
          } : undefined
        };
        
        setItemEncontrado(itemCompleto);
      } else {
        setItemEncontrado(null);
      }
    } catch (error) {
      console.error('Erro ao buscar item:', error);
    } finally {
      setBuscando(false);
    }
  };

  const calcularNovoPrecoUnitario = () => {
    const qtd = parseFloat(quantidade);
    const valor = parseFloat(valorTotal);
    if (qtd > 0 && valor > 0) {
      return (valor / qtd).toFixed(4);
    }
    return '0';
  };

  const handleConfirmar = async () => {
    if (!itemEncontrado || !quantidade) return;

    try {
      setSalvando(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const qtd = parseFloat(quantidade);
      const valor = parseFloat(valorTotal || '0');
      const custoUnitario = valor > 0 ? valor / qtd : itemEncontrado.preco_ativo?.custo_unitario || 0;

      // Registrar movimento
      const { error: erroMov } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          item_id: itemEncontrado.id,
          usuario_id: user.id,
          tipo: tipoMovimento.toUpperCase() as 'ENTRADA' | 'SAIDA',
          tipo_item: itemEncontrado.tipo === 'ingrediente' ? 'INSUMO' : 'EMBALAGEM',
          quantidade: qtd,
          unidade: itemEncontrado.unidade_base,
          custo_unitario: custoUnitario,
          custo_total: custoUnitario * qtd,
          data: new Date().toISOString(),
          observacoes: observacao || null
        }]);

      if (erroMov) throw erroMov;

      // Se for entrada com novo preço, atualizar preço
      if (tipoMovimento === 'entrada' && valor > 0) {
        // Desativar preço anterior
        await supabase
          .from('precos')
          .update({ ativo: false })
          .eq('item_id', itemEncontrado.id)
          .eq('ativo', true);

        // Inserir novo preço
        await supabase
          .from('precos')
          .insert({
            item_id: itemEncontrado.id,
            usuario_id: user.id,
            marca: itemEncontrado.marca || 'Sem marca',
            fornecedor: itemEncontrado.fornecedor_padrao,
            preco_total_embalagem: valor,
            quantidade_embalagem: qtd,
            custo_unitario: custoUnitario,
            ativo: true,
            data_coleta: new Date().toISOString()
          });
      }

      toast({
        title: "Movimentação registrada!",
        description: `${tipoMovimento === 'entrada' ? 'Entrada' : 'Saída'} de ${qtd} ${itemEncontrado.unidade_base} registrada com sucesso.`,
      });

      // Resetar formulário
      setBusca('');
      setItemEncontrado(null);
      setQuantidade('');
      setValorTotal('');
      setObservacao('');

      if (onSucesso) onSucesso();
      onFechar();
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro ao registrar",
        description: error.message || 'Ocorreu um erro ao registrar a movimentação',
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Dialog open={aberto} onOpenChange={onFechar}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Movimentação de Estoque
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Campo de busca */}
            <div className="space-y-2">
              <Label htmlFor="busca">Buscar Item</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome do item..."
                  className="pl-10"
                  autoFocus
                />
                {buscando && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Buscando...
                  </span>
                )}
              </div>
            </div>

            {/* Item não encontrado */}
            {busca.length >= 3 && !itemEncontrado && !buscando && (
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span>⚠️ Item não cadastrado</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setModalCadastroAberto(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Item encontrado - formulário de movimentação */}
            {itemEncontrado && (
              <div className="space-y-4">
                {/* Card do item */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-lg">{itemEncontrado.nome}</div>
                      {itemEncontrado.marca && (
                        <Badge variant="outline" className="mt-1">
                          {itemEncontrado.marca}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Saldo Atual</div>
                        <div className="font-semibold font-mono">
                          {itemEncontrado.estoque?.saldo?.toFixed(2) || '0'} {itemEncontrado.unidade_base}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Custo Unitário</div>
                        <div className="font-semibold font-mono">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(itemEncontrado.preco_ativo?.custo_unitario || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ponto de Pedido</div>
                        <div className="font-semibold font-mono">
                          {itemEncontrado.ponto_de_pedido || '-'} {itemEncontrado.unidade_base}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tipo de movimentação */}
                <Tabs value={tipoMovimento} onValueChange={(v) => setTipoMovimento(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="entrada">
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Entrada
                    </TabsTrigger>
                    <TabsTrigger value="saida">
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      Saída
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="entrada" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantidade">Quantidade *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="quantidade"
                            type="number"
                            step="0.01"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            placeholder="Ex: 10"
                          />
                          <span className="flex items-center text-sm text-muted-foreground">
                            {itemEncontrado.unidade_base}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valorTotal">Valor Total (opcional)</Label>
                        <Input
                          id="valorTotal"
                          type="number"
                          step="0.01"
                          value={valorTotal}
                          onChange={(e) => setValorTotal(e.target.value)}
                          placeholder="Ex: 85.00"
                        />
                      </div>
                    </div>

                    {quantidade && valorTotal && (
                      <Alert>
                        <AlertDescription>
                          💡 Novo preço unitário: R$ {calcularNovoPrecoUnitario()}/{itemEncontrado.unidade_base}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="observacao">Observação</Label>
                      <Input
                        id="observacao"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Ex: Compra no atacadão"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="saida" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantidade-saida">Quantidade *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="quantidade-saida"
                            type="number"
                            step="0.01"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            placeholder="Ex: 2"
                          />
                          <span className="flex items-center text-sm text-muted-foreground">
                            {itemEncontrado.unidade_base}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Novo Saldo</Label>
                        <div className="flex h-10 items-center font-mono font-semibold">
                          {((itemEncontrado.estoque?.saldo || 0) - parseFloat(quantidade || '0')).toFixed(2)}
                          {' '}{itemEncontrado.unidade_base}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacao-saida">Motivo da Saída</Label>
                      <Input
                        id="observacao-saida"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Ex: Produção, Perda, Quebra"
                      />
                    </div>

                    {quantidade && parseFloat(quantidade) > (itemEncontrado.estoque?.saldo || 0) && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          ⚠️ Quantidade de saída é maior que o saldo atual!
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Botões */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onFechar} disabled={salvando}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmar} disabled={salvando || !quantidade}>
                    {salvando ? 'Confirmando...' : '✅ Confirmar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de cadastro caso item não exista */}
      <ModalItem
        open={modalCadastroAberto}
        onOpenChange={setModalCadastroAberto}
        onSave={async () => {
          setModalCadastroAberto(false);
          setBusca('');
          return { success: true };
        }}
      />
    </>
  );
}
