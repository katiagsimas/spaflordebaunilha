import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCategorias } from "@/hooks/useCategorias";
import { Tag, Search, Filter, Download, Plus, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, LayoutList } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from '@/lib/xlsxShim';
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Categorias() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const { categorias, loading, updateCategoria, createCategoria, deleteCategoria } = useCategorias();
  
  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [resultadosPorPagina, setResultadosPorPagina] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ campo: 'nome' | 'ativo'; direcao: 'asc' | 'desc' }>({ campo: 'nome', direcao: 'asc' });
  const [isRelatorioOpen, setIsRelatorioOpen] = useState(false);


  // Estado do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<{ id: string; nome: string } | null>(null);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (loading) {
      showLoading("Carregando categorias...");
    } else {
      hideLoading();
    }
  }, [loading, showLoading, hideLoading]);

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await updateCategoria(id, { ativo: !ativo });
      toast.success(!ativo ? "Categoria habilitada" : "Categoria desabilitada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar categoria");
    }
  };

  // Filtrar e ordenar categorias
  const categoriasFiltradas = useMemo(() => {
    let resultado = [...categorias];

    // Busca por nome
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(c => 
        c.nome.toLowerCase().includes(termo)
      );
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      const ativo = filtroStatus === 'ativo';
      resultado = resultado.filter(c => c.ativo === ativo);
    }

    // Ordenar
    resultado.sort((a, b) => {
      let comparacao = 0;
      if (ordenacao.campo === 'nome') {
        comparacao = a.nome.localeCompare(b.nome);
      } else if (ordenacao.campo === 'ativo') {
        comparacao = a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1;
      }
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });

    return resultado;
  }, [categorias, termoBusca, filtroStatus, ordenacao]);

  // Aplicar paginação
  const totalItems = categoriasFiltradas.length;
  const itemsPerPage = resultadosPorPagina === 'todos' ? totalItems : parseInt(resultadosPorPagina);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const categoriasPaginadas = useMemo(() => {
    if (resultadosPorPagina === 'todos') {
      return categoriasFiltradas;
    }
    const start = (currentPage - 1) * itemsPerPage;
    return categoriasFiltradas.slice(start, start + itemsPerPage);
  }, [categoriasFiltradas, currentPage, itemsPerPage, resultadosPorPagina]);

  useEffect(() => {
    setCurrentPage(1);
  }, [termoBusca, filtroStatus, resultadosPorPagina]);

  const toggleOrdenacao = (campo: 'nome' | 'ativo') => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };


  const handleExportar = () => {
    try {
      const dados = categoriasFiltradas.map(c => ({
        'Categoria': c.nome,
        'Status': c.ativo ? 'Habilitada' : 'Desabilitada',
      }));

      const ws = XLSX.utils.json_to_sheet(dados);
      ws['!cols'] = [{ wch: 40 }, { wch: 15 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Categorias');
      
      const hoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Categorias_${hoje}.xlsx`);

      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível exportar.');
    }
  };

  const handleAbrirModal = (categoria?: { id: string; nome: string }) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setNomeCategoria(categoria.nome);
    } else {
      setCategoriaEditando(null);
      setNomeCategoria('');
    }
    setModalAberto(true);
  };

  const handleSalvarCategoria = async () => {
    if (!nomeCategoria.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    try {
      setSalvando(true);
      if (categoriaEditando) {
        await updateCategoria(categoriaEditando.id, { nome: nomeCategoria.trim() });
      } else {
        await createCategoria(nomeCategoria.trim());
      }
      setModalAberto(false);
    } catch (error: any) {
      // toast já é exibido pelo hook
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCategoria = async (id: string, nome: string) => {
    if (confirm(`Deseja realmente excluir a categoria "${nome}"?`)) {
      try {
        await deleteCategoria(id);
      } catch (error) {
        // toast já é exibido pelo hook
      }
    }
  };

  const handleLimparFiltros = () => {
    setTermoBusca('');
    setFiltroStatus('todos');
  };

  const filtrosAtivos = [
    termoBusca.trim() !== '',
    filtroStatus !== 'todos',
  ].filter(Boolean).length;

  if (loading && !categorias.length) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Gerencie as categorias dos seus itens e produtos"
        backButton={<BackButton to="/cadastros" />}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRelatorioOpen(true)}
              className="border-sfb-terracota text-sfb-terracota hover:bg-sfb-terracota/10 gap-2"
            >
              <LayoutList className="h-4 w-4" />
              Relatório
            </Button>
            <Button onClick={() => handleAbrirModal()} className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Filtros</h3>
                  {filtrosAtivos > 0 && (
                    <Badge variant="secondary">{filtrosAtivos} ativo(s)</Badge>
                  )}
                </div>
                {filtrosAtivos > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
                    Limpar Filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Busca */}
                <div className="space-y-2">
                  <Label>Buscar por nome</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome da categoria..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Habilitadas</SelectItem>
                      <SelectItem value="inativo">Desabilitadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <strong>{categoriasPaginadas.length}</strong> de <strong>{categoriasFiltradas.length}</strong> categoria(s)
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Resultados por página:</Label>
                    <Select value={resultadosPorPagina} onValueChange={setResultadosPorPagina}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="todos">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleExportar} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>
            </div>

            {/* Tabela */}
            {categoriasPaginadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {termoBusca || filtrosAtivos > 0 
                  ? 'Nenhuma categoria encontrada.' 
                  : 'Nenhuma categoria cadastrada.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-sfb-terracota transition-colors"
                      onClick={() => toggleOrdenacao('nome')}
                    >
                      <div className="flex items-center gap-2">
                        Categoria
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[150px] text-center cursor-pointer hover:text-sfb-terracota transition-colors"
                      onClick={() => toggleOrdenacao('ativo')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasPaginadas.map((categoria) => (
                    <TableRow 
                      key={categoria.id}
                      className={!categoria.ativo ? 'opacity-50 bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-2">
                          <Switch
                            checked={categoria.ativo}
                            onCheckedChange={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                          />
                          <span className="text-xs text-muted-foreground w-20 text-left">
                            {categoria.ativo ? "Habilitada" : "Desabilitada"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleAbrirModal({ id: categoria.id, nome: categoria.nome })}
                              className="gap-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {!categoria.padrao_sistema && (
                              <DropdownMenuItem 
                                onClick={() => handleExcluirCategoria(categoria.id, categoria.nome)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Relatório Consolidação */}
        <RelatorioCategorias 
          open={isRelatorioOpen} 
          onOpenChange={setIsRelatorioOpen} 
        />

        {/* Modal de Cadastro/Edição */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Escalda Pés, Sabonetes..."
                  value={nomeCategoria}
                  onChange={(e) => setNomeCategoria(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSalvarCategoria()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvarCategoria} 
                disabled={salvando}
                className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-white"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
