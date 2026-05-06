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

export default function EstoqueEntrada() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGroup } = useGroup();
  const { registrarEntrada } = useEstoque();
  const [tipo, setTipo] = useState<'ingrediente' | 'embalagem'>('ingrediente');
  const [insumoId, setInsumoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [custoTotal, setCustoTotal] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Load ingredientes or embalagens based on type
  const { data: ingredientes = [] } = useQuery({
    queryKey: ['ingredientes-estoque', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ingredientes')
        .select('id, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao)')
        .eq('usuario_id', user!.id) as any;
      return (data || []).map((i: any) => ({ id: i.id, nome: i.tipos_insumos?.descricao || 'Ingrediente' }));
    },
    enabled: !!user && tipo === 'ingrediente',
  });

  const { data: embalagens = [] } = useQuery({
    queryKey: ['embalagens-estoque', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('embalagens')
        .select('id, tipo_insumo_id, tipos_insumos:tipo_insumo_id(descricao)')
        .eq('usuario_id', user!.id) as any;
      return (data || []).map((e: any) => ({ id: e.id, nome: e.tipos_insumos?.descricao || 'Embalagem' }));
    },
    enabled: !!user && tipo === 'embalagem',
  });

  const insumos = tipo === 'ingrediente' ? ingredientes : embalagens;

  const custoUnitario = Number(quantidade) > 0 ? Number(custoTotal) / Number(quantidade) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoId || !quantidade || !custoTotal) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSalvando(true);
      await registrarEntrada({
        tipo,
        ingrediente_id: tipo === 'ingrediente' ? insumoId : undefined,
        embalagem_id: tipo === 'embalagem' ? insumoId : undefined,
        quantidade: Number(quantidade),
        custo_total: Number(custoTotal),
        observacao: observacao || undefined,
        owner_group_id: activeGroup?.id,
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
        description="Registre uma compra de ingrediente ou embalagem"
        backButton={<BackButton to="/estoque" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-body">Dados da Entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Tipo de Insumo *</Label>
              <Select value={tipo} onValueChange={(v) => { setTipo(v as any); setInsumoId(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingrediente">Ingrediente</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Insumo *</Label>
              <Select value={insumoId} onValueChange={setInsumoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o insumo" />
                </SelectTrigger>
                <SelectContent>
                  {insumos.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade Comprada *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Custo Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={custoTotal}
                  onChange={(e) => setCustoTotal(e.target.value)}
                  placeholder="Ex: 25.90"
                />
              </div>
            </div>

            {Number(quantidade) > 0 && Number(custoTotal) > 0 && (
              <div className="p-3 rounded-lg bg-muted">
                <span className="text-sm font-body text-muted-foreground">
                  Custo unitário calculado:{' '}
                  <strong>{custoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </span>
              </div>
            )}

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
