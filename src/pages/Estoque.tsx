import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NovaEntradaDialog } from "@/components/estoque/NovaEntradaDialog";
import { NovaSaidaDialog } from "@/components/estoque/NovaSaidaDialog";
import { useEstoque } from "@/hooks/useEstoque";

export default function Estoque() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [entradaOpen, setEntradaOpen] = useState(false);
  const [saidaOpen, setSaidaOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);

  const { 
    items, 
    isLoading, 
    refetch,
    resumo 
  } = useEstoque({
    searchTerm,
    categoriaFiltro,
    statusFiltro,
    tipoFiltro
  });

  const handleNovaEntrada = (item?: any) => {
    setItemSelecionado(item);
    setEntradaOpen(true);
  };

  const handleNovaSaida = (item?: any) => {
    setItemSelecionado(item);
    setSaidaOpen(true);
  };

  const getStatusBadge = (item: any) => {
    if (item.quantidade_atual === 0) {
      return <Badge variant="outline" className="bg-muted text-muted-foreground">📭 ZERADO</Badge>;
    }
    if (item.quantidade_atual < item.estoque_minimo) {
      return <Badge variant="destructive">🔴 BAIXO</Badge>;
    }
    if (item.quantidade_atual < item.estoque_minimo * 1.2) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🟡 ATENÇÃO</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">🟢 OK</Badge>;
  };

  if (items?.length === 0 && !searchTerm && statusFiltro === "todos") {
    return (
      <div className="container mx-auto p-6">
        <PageHeader
          title="Estoque"
          description="Controle seu estoque de ingredientes e embalagens"
        />
        <EmptyState
          icon={Package}
          title="Nenhum item no estoque ainda"
          description="Para começar, vá até Precificação e marque os insumos/embalagens que deseja controlar no estoque."
          actionLabel="Ir para Precificação"
          onAction={() => window.location.href = "/precificacao"}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Estoque Atual"
          description="Gerencie entradas e saídas do seu estoque"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/estoque/relatorios")}>
            <FileText className="mr-2 h-4 w-4" />
            Relatórios
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => handleNovaEntrada()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">⚠️ Alertas</span>
            <span className="text-3xl font-bold text-destructive">{resumo?.alertas || 0}</span>
            <span className="text-xs text-muted-foreground">itens abaixo do mínimo</span>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">📅 Vencendo</span>
            <span className="text-3xl font-bold text-orange-600">{resumo?.vencendo || 0}</span>
            <span className="text-xs text-muted-foreground">itens em 30 dias</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">💰 Valor Total</span>
            <span className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo?.valorTotal || 0)}
            </span>
            <span className="text-xs text-muted-foreground">em estoque</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">📦 Itens Ativos</span>
            <span className="text-3xl font-bold text-green-600">{resumo?.itensAtivos || 0}</span>
            <span className="text-xs text-muted-foreground">itens</span>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="🔍 Buscar por nome do item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="📁 Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Categorias</SelectItem>
              <SelectItem value="base">Ingredientes Base</SelectItem>
              <SelectItem value="especiais">Ingredientes Especiais</SelectItem>
              <SelectItem value="decoracao">Decoração</SelectItem>
              <SelectItem value="embalagens">Embalagens</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="⚠️ Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="baixo">🔴 Abaixo do Mínimo</SelectItem>
              <SelectItem value="atencao">🟡 Atenção</SelectItem>
              <SelectItem value="ok">🟢 OK</SelectItem>
              <SelectItem value="zerado">📭 Zerado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="🏷️ Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="INSUMO">Insumos</SelectItem>
              <SelectItem value="EMBALAGEM">Embalagens</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead>Un</TableHead>
              <TableHead className="text-right">Mín</TableHead>
              <TableHead className="text-right">Custo Un</TableHead>
              <TableHead className="text-right">Valor Tot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              items?.map((item: any) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => window.location.href = `/estoque/${item.id}`}
                >
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.categoria || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantidade_atual?.toFixed(2) || 0}</TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell className="text-right">{item.estoque_minimo || '-'}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_medio || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total || 0)}
                  </TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleNovaEntrada(item)}
                      >
                        ➕
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleNovaSaida(item)}
                      >
                        ➖
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <NovaEntradaDialog 
        open={entradaOpen} 
        onOpenChange={setEntradaOpen}
        itemSelecionado={itemSelecionado}
        onSuccess={() => {
          refetch();
          setItemSelecionado(null);
        }}
      />

      <NovaSaidaDialog 
        open={saidaOpen} 
        onOpenChange={setSaidaOpen}
        itemSelecionado={itemSelecionado}
        onSuccess={() => {
          refetch();
          setItemSelecionado(null);
        }}
      />
    </div>
  );
}
