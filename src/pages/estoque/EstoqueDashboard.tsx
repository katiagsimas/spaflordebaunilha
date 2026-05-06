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
        title="Meus Insumos"
        description="Controle o estoque de ingredientes e embalagens da sua confeitaria"
      />

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-body">Valor Total em Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-umbrella-dourado" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body">
              {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-body">Itens Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-umbrella-pistache" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body">{itens.length}</div>
          </CardContent>
        </Card>

        <Card className={itensAbaixoMinimo.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-body">Abaixo do Mínimo</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${itensAbaixoMinimo.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-body ${itensAbaixoMinimo.length > 0 ? 'text-destructive' : ''}`}>
              {itensAbaixoMinimo.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/estoque/entrada')} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Entrada
        </Button>
        <Button variant="outline" onClick={() => navigate('/estoque/ajuste')} className="gap-2">
          <ArrowDownUp className="h-4 w-4" /> Ajuste Manual
        </Button>
        <Button variant="outline" onClick={() => navigate('/estoque/movimentacoes')} className="gap-2">
          <Search className="h-4 w-4" /> Movimentações
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar insumo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="ingrediente">Ingredientes</SelectItem>
            <SelectItem value="embalagem">Embalagens</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48">
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
        <Card>
          <CardContent className="p-0">
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
                          <Badge className="bg-umbrella-pistache text-umbrella-preto font-body text-xs">OK</Badge>
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
