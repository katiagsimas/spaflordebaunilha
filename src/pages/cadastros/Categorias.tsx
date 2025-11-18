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
import { Tag, Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";

export default function Categorias() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const { categorias, loading, updateCategoria } = useCategorias();
  
  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [resultadosPorPagina, setResultadosPorPagina] = useState('todos');

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

    // Ordenar: habilitadas primeiro, depois por nome
    resultado.sort((a, b) => {
      if (a.ativo === b.ativo) {
        return a.nome.localeCompare(b.nome);
      }
      return a.ativo ? -1 : 1;
    });

    return resultado;
  }, [categorias, termoBusca, filtroStatus]);

  // Aplicar paginação
  const categoriasPaginadas = useMemo(() => {
    if (resultadosPorPagina === 'todos') {
      return categoriasFiltradas;
    }
    const limite = parseInt(resultadosPorPagina);
    return categoriasFiltradas.slice(0, limite);
  }, [categoriasFiltradas, resultadosPorPagina]);

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
      XLSX.writeFile(wb, `Categorias_Receitas_${hoje}.xlsx`);

      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível exportar.');
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Receitas"
        description="Gerencie as categorias de receitas"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Categorias de Receitas</CardTitle>
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
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasPaginadas.map((categoria) => (
                    <TableRow 
                      key={categoria.id}
                      className={!categoria.ativo ? 'opacity-50 bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {categoria.ativo ? "Habilitada" : "Desabilitada"}
                          </span>
                          <Switch
                            checked={categoria.ativo}
                            onCheckedChange={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
