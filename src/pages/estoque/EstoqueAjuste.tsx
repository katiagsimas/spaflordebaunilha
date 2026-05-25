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
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

export default function EstoqueAjuste() {
  const navigate = useNavigate();
  const { activeGroup } = useGroup();
  const { itens, registrarSaidaManual } = useEstoque();
  const [estoqueId, setEstoqueId] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState('perda');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const itemSelecionado = itens.find(i => i.id === estoqueId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estoqueId || !quantidade || !motivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSalvando(true);
      await registrarSaidaManual({
        estoque_id: estoqueId,
        quantidade: Number(quantidade),
        motivo: `[${tipoAjuste.toUpperCase()}] ${motivo}`,
        tipo_ajuste: tipoAjuste === 'correcao' ? 'correcao' : 'saida_manual',
      });
      navigate('/estoque');
    } catch (err: any) {
      toast.error('Erro ao registrar ajuste: ' + (err.message || ''));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajuste Manual de Estoque"
        description="Registre perdas, doações ou correções de inventário"
        backButton={<BackButton to="/estoque" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-body">Dados do Ajuste</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Item do Estoque *</Label>
              <Select value={estoqueId} onValueChange={setEstoqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o item" />
                </SelectTrigger>
                <SelectContent>
                  {itens.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome_insumo} ({Number(item.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {item.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Ajuste *</Label>
              <Select value={tipoAjuste} onValueChange={setTipoAjuste}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perda">Perda</SelectItem>
                  <SelectItem value="doacao">Doação</SelectItem>
                  <SelectItem value="correcao">Correção de Inventário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={itemSelecionado ? Number(itemSelecionado.quantidade_atual) : undefined}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex: 2"
              />
              {itemSelecionado && (
                <p className="text-xs text-muted-foreground">
                  Disponível: {Number(itemSelecionado.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {itemSelecionado.unidade}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Descreva o motivo do ajuste"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Registrar Ajuste'}
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
