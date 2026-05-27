import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { useEstoque } from '@/hooks/useEstoque';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Package, AlertTriangle, DollarSign, Plus, ArrowDownUp, Search } from 'lucide-react';

export default function EstoqueDashboard() {
  const navigate = useNavigate();
  const { itens, loading, valorTotal, itensAbaixoMinimo } = useEstoque();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  if (loading) return <LoadingState />;

  const itensFiltrados = itens.filter(item => {
    const matchBusca = !busca || (item.nome_insumo || '').toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
    const matchStatus = filtroStatus === 'todos' ||
      (filtroStatus === 'baixo' && item.estoque_minimo != null && item.quantidade_atual < item.estoque_minimo);
    return matchBusca && matchTipo && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Controle o estoque de ingredientes e embalagens da sua confeitaria"
        actions={
          <>
            <Button onClick={() => navigate('/estoque/entrada')} className="gap-2 bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro">
              <Plus className="h-4 w-4" /> Nova Entrada
            </Button>
            <Button variant="outline" onClick={() => navigate('/estoque/ajuste')} className="gap-2 border-cda-dourado/40 text-cda-vinho hover:border-cda-dourado hover:bg-cda-creme">
              <ArrowDownUp className="h-4 w-4" /> Ajuste Manual
            </Button>
            <Button variant="outline" onClick={() => navigate('/estoque/movimentacoes')} className="gap-2 border-cda-dourado/40 text-cda-vinho hover:border-cda-dourado hover:bg-cda-creme">
              <Search className="h-4 w-4" /> Movimentações
            </Button>
          </>
        }
      />

      {/* KPIs no padrão Dashboard */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: 'Valor Total em Estoque',
            value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            Icon: DollarSign,
            iconBg: 'bg-cda-dourado/15',
            iconColor: 'text-cda-vinho',
            accent: 'text-cda-vinho',
          },
          {
            label: 'Itens Cadastrados',
            value: itens.length.toString(),
            Icon: Package,
            iconBg: 'bg-cda-vinho/10',
            iconColor: 'text-cda-vinho',
            accent: 'text-cda-vinho',
          },
          {
            label: 'Abaixo do Mínimo',
            value: itensAbaixoMinimo.length.toString(),
            Icon: AlertTriangle,
            iconBg: itensAbaixoMinimo.length > 0 ? 'bg-cda-pink/30' : 'bg-cda-vinho/10',
            iconColor: itensAbaixoMinimo.length > 0 ? 'text-cda-coral' : 'text-cda-vinho',
            accent: itensAbaixoMinimo.length > 0 ? 'text-cda-coral' : 'text-cda-vinho',
          },
        ].map(({ label, value, Icon, iconBg, iconColor, accent }) => (
          <div
            key={label}
            className="group flex items-center gap-4 rounded-2xl border border-cda-dourado/20 bg-cda-branco px-5 py-4 shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] transition hover:-translate-y-0.5 hover:border-cda-dourado/60 hover:shadow-[0_8px_24px_-12px_rgba(91,26,43,0.25)]"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg} ring-1 ring-cda-dourado/40`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm text-cda-vinho-escuro">{label}</p>
              <p className={`mt-0.5 font-display text-xl ${accent}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar insumo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs border-cda-dourado/40 bg-cda-branco focus-visible:border-cda-dourado"
        />
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40 border-cda-dourado/40 bg-cda-branco">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="ingrediente">Ingredientes</SelectItem>
            <SelectItem value="embalagem">Embalagens</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48 border-cda-dourado/40 bg-cda-branco">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="baixo">Abaixo do mínimo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      {itensFiltrados.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum insumo no estoque"
          description="Registre sua primeira entrada para começar a controlar seu estoque."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cda-dourado/20 bg-cda-branco shadow-[0_4px_24px_-12px_rgba(91,26,43,0.15)]">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Médio</TableHead>
                  <TableHead className="text-right">Valor em Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensFiltrados.map((item) => {
                  const abaixoMinimo = item.estoque_minimo != null && item.quantidade_atual < item.estoque_minimo;
                  const valorItem = item.quantidade_atual * item.custo_medio;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium font-body">{item.nome_insumo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-body text-xs">
                          {item.tipo === 'ingrediente' ? 'Ingrediente' : 'Embalagem'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-body">
                        {Number(item.quantidade_atual).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {item.unidade}
                      </TableCell>
                      <TableCell className="text-right font-body">
                        {Number(item.custo_medio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right font-body">
                        {valorItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-center">
                        {abaixoMinimo ? (
                          <Badge variant="destructive" className="font-body text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Baixo
                          </Badge>
                        ) : (
                          <Badge className="bg-success-light text-success font-body text-xs">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
