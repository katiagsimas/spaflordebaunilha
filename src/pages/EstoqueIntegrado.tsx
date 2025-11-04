import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Package, Search, Filter, TrendingUp, AlertTriangle, DollarSign, Boxes } from "lucide-react";
import { useEstoqueIntegrado } from "@/hooks/useEstoqueIntegrado";
import { ModalItem } from "@/components/estoque/ModalItem";
import { BadgeStatus } from "@/components/estoque/BadgeStatus";
import type { FiltrosEstoque, Item } from "@/types/estoque";

export default function EstoqueIntegrado() {
  const [filtros, setFiltros] = useState<FiltrosEstoque>({});
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<Item | undefined>();

  const { itens, loading, resumo, criarItem, atualizarItem } = useEstoqueIntegrado({
    ...filtros,
    busca: busca || undefined
  });

  const handleNovoItem = () => {
    setItemSelecionado(undefined);
    setModalOpen(true);
  };

  const handleEditarItem = (item: Item) => {
    setItemSelecionado(item);
    setModalOpen(true);
  };

  const handleSalvarItem = async (item: Partial<Item>) => {
    if (itemSelecionado) {
      return await atualizarItem(itemSelecionado.id, item);
    } else {
      return await criarItem(item as any);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque Integrado"
        description="Gestão completa de ingredientes e embalagens"
      />

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.total_itens || 0}</div>
            <p className="text-xs text-muted-foreground">
              {resumo?.itens_rastreados || 0} com rastreamento ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{resumo?.alertas_baixo || 0}</div>
            <p className="text-xs text-muted-foreground">Itens abaixo do ponto mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Zerados</CardTitle>
            <Boxes className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{resumo?.alertas_zerado || 0}</div>
            <p className="text-xs text-muted-foreground">Sem estoque disponível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo?.valor_total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Valor do estoque atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catálogo de Itens</CardTitle>
              <CardDescription>Gerencie ingredientes e embalagens em um só lugar</CardDescription>
            </div>
            <Button onClick={handleNovoItem}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de Filtro */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filtros.tipo || "todos"}
              onValueChange={(value) => setFiltros({ ...filtros, tipo: value === "todos" ? undefined : value as any })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ingrediente">Ingredientes</SelectItem>
                <SelectItem value="embalagem">Embalagens</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.status || "todos"}
              onValueChange={(value) => setFiltros({ ...filtros, status: value === "todos" ? undefined : value as any })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="zerado">Zerado</SelectItem>
                <SelectItem value="sem_rastreio">Sem rastreio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Custo Médio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[90px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : itens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhum item encontrado. Clique em "Novo Item" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.nome}</div>
                          {item.descricao && (
                            <div className="text-xs text-muted-foreground">{item.descricao}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.tipo === 'ingrediente' ? '🍰 Ingrediente' : '📦 Embalagem'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.categoria || '-'}</TableCell>
                      <TableCell>{item.unidade_base}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.estoque?.saldo ? item.estoque.saldo.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.estoque?.custo_medio ? 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estoque.custo_medio)
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <BadgeStatus 
                          status={item.status || 'sem_rastreio'} 
                          saldo={item.estoque?.saldo}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarItem(item)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Item */}
      <ModalItem
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={itemSelecionado}
        onSave={handleSalvarItem}
      />
    </div>
  );
}
