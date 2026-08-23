import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  Plus, Edit2, ChevronLeft, Leaf, Sparkles, Home, MoreVertical, 
  Trash2, PauseCircle, PlayCircle, Search, Filter, Download, 
  FileJson, FileText, ChevronRight, ChevronsLeft, ChevronsRight,
  Tag
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProdutoRevendaForm } from "@/components/ProdutoRevendaForm";
import { useProdutosRevenda, type ProdutoRevenda } from "@/hooks/useProdutosRevenda";
import { useCategorias } from "@/hooks/useCategorias";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


export default function MarcaRevendaPage() {
  const navigate = useNavigate();
  const { marca } = useParams<{ marca: 'natura' | 'avon' }>();
  const [searchParams] = useSearchParams();
  const codigoParam = searchParams.get('codigo');
  const origemParam = searchParams.get('origem');

  const dbMarca = marca as 'natura' | 'avon';
  
  const { produtos, loading: loadingProdutos, deleteProduto, updateProduto } = useProdutosRevenda(dbMarca);
  const { categorias } = useCategorias();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoRevenda | undefined>(undefined);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(codigoParam ?? "");
  const [statusFilter, setStatusFilter] = useState<"todos" | "Ativo" | "Pausado">("todos");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Abre automaticamente o formulário de cadastro quando o produto não existe, ou o de edição quando existe
  const autoAbertoRef = useRef(false);
  useEffect(() => {
    if (autoAbertoRef.current || !codigoParam || loadingProdutos) return;
    autoAbertoRef.current = true;
    
    const alvo = produtos.find((p) => (p.codigo || '').trim() === codigoParam.trim());
    if (alvo) {
      setEditingProduto(alvo);
    } else {
      // Se não encontrar, abre para cadastro com o código pré-preenchido
      setEditingProduto({ codigo: codigoParam, marca: dbMarca, status: 'Ativo' } as any);
    }
    setIsFormOpen(true);
  }, [codigoParam, produtos, loadingProdutos, dbMarca]);


  const filteredProdutos = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return produtos.filter((produto) => {
      const matchesStatus = statusFilter === "todos" || produto.status === statusFilter;
      const matchesCategoria = categoriaFilter === "todos" || produto.categoria_id === categoriaFilter;
      
      if (!matchesStatus || !matchesCategoria) return false;
      
      if (!term) return true;
      
      const matchesSearch =
        (produto.descricao?.toLowerCase().includes(term)) ||
        (produto.codigo?.toLowerCase().includes(term)) ||
        (produto.linha?.toLowerCase().includes(term));
      return matchesSearch;
    });
  }, [produtos, searchQuery, statusFilter, categoriaFilter]);

  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage);
  const paginatedProdutos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProdutos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProdutos, currentPage]);

  const totalNatura = useMemo(() => {
    return produtos.filter(p => p.marca === 'natura').length;
  }, [produtos]);

  const exportToCSV = () => {
    const data = filteredProdutos.map(p => {
      const categoria = categorias.find(c => c.id === p.categoria_id);
      return {
        Codigo: p.codigo || '',
        Descricao: p.descricao,
        Categoria: categoria?.nome || '-',
        Linha: p.linha || '',
        'Qtd/ml': p.quantidade_ml || '',
        'Preço Custo': Number(p.preco ?? 0).toFixed(2),
        'Preço Venda': Number(p.preco_venda ?? 0).toFixed(2),
        Pontos: p.quantidade_pontos || 0,
        Status: p.status
      };
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produtos_${marca}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Código", "Descrição", "Categoria", "Linha", "Qtd/ml", "Preço Custo", "Preço Venda", "Pontos", "Status"];
    const tableRows = filteredProdutos.map(p => {
      const categoria = categorias.find(c => c.id === p.categoria_id);
      return [
        p.codigo || '',
        p.descricao,
        categoria?.nome || '-',
        p.linha || '',
        p.quantidade_ml || '',
        `R$ ${Number(p.preco ?? 0).toFixed(2)}`,
        `R$ ${Number(p.preco_venda ?? 0).toFixed(2)}`,
        p.quantidade_pontos || 0,
        p.status
      ];
    });

    doc.setFontSize(18);
    doc.text(`Produtos ${config.label}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      headStyles: { fillColor: [201, 138, 117] }, // Terracota
    });

    doc.save(`produtos_${marca}_${new Date().toISOString().split('T')[0]}.pdf`);
  };


  const getMarcaConfig = (m: string | undefined) => {
    switch(m) {
      case 'natura': 
        return { label: 'Natura', icon: Leaf, desc: 'Gestão de produtos e pedidos Natura' };
      case 'avon': 
        return { label: 'Avon', icon: Sparkles, desc: 'Gestão de produtos e pedidos Avon' };
      default: 
        return { label: 'Marca', icon: Home, desc: '' };
    }
  };

  const config = getMarcaConfig(marca);

  const handleOpenForm = (produto?: ProdutoRevenda) => {
    setEditingProduto(produto);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (produto: ProdutoRevenda) => {
    const newStatus = produto.status === 'Ativo' ? 'Pausado' : 'Ativo';
    await updateProduto(produto.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (produtoToDelete) {
      await deleteProduto(produtoToDelete);
      setProdutoToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <PageHeader
        title={marca === 'natura' ? `Produtos ${config.label} (${totalNatura})` : `Produtos ${config.label}`}
        description={config.desc}
      />

      <div className="container mx-auto px-6 pt-4 space-y-8">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => {
              if (origemParam === 'estoque') {
                navigate("/estoque/entrada");
              } else {
                navigate("/cadastros/produtos-revenda");
              }
            }}
            className="border-sfb-areia/60 text-sfb-cacau hover:bg-sfb-baunilha gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
        <h2 className="text-xl font-display font-semibold text-sfb-cacau">Catálogo de Produtos</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sfb-cacau/50" />
            <Input
              placeholder="Buscar por nome, código ou linha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-sfb-areia/60 text-sfb-cacau placeholder:text-sfb-cacau/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "todos" | "Ativo" | "Pausado")}>
            <SelectTrigger className="w-full md:w-[130px] bg-white border-sfb-areia/60 text-sfb-cacau gap-2">
              <Filter className="h-4 w-4 text-sfb-terracota" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-sfb-areia/60">
              <SelectItem value="todos">Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-white border-sfb-areia/60 text-sfb-cacau gap-2">
              <Tag className="h-4 w-4 text-sfb-terracota" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-white border-sfb-areia/60">
              <SelectItem value="todos">Categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-sfb-areia/60 text-sfb-cacau bg-white hover:bg-sfb-baunilha gap-2">
                  <Download className="h-4 w-4 text-sfb-terracota" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-2 border-sfb-areia/60">
                <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau">
                  <FileJson className="h-4 w-4 text-sfb-terracota" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau">
                  <FileText className="h-4 w-4 text-sfb-terracota" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="bg-white border-2 border-sfb-areia/60 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sfb-terracota">
                <TableRow className="hover:bg-sfb-terracota border-sfb-terracota">
                  <TableHead className="w-[100px] text-sfb-baunilha">Código</TableHead>
                  <TableHead className="text-sfb-baunilha">Descrição</TableHead>
                  <TableHead className="text-sfb-baunilha">Categoria</TableHead>
                  <TableHead className="text-sfb-baunilha">Linha</TableHead>
                  <TableHead className="text-sfb-baunilha">Qtd/ml</TableHead>
                  <TableHead className="text-sfb-baunilha text-right">Custo</TableHead>
                  <TableHead className="text-sfb-baunilha text-right">Venda</TableHead>
                  <TableHead className="text-sfb-baunilha text-center">Pontos</TableHead>
                  <TableHead className="text-sfb-baunilha text-center">Status</TableHead>
                  <TableHead className="text-right text-sfb-baunilha">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {loadingProdutos ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : filteredProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery || statusFilter !== "todos"
                        ? "Nenhum produto encontrado para os filtros aplicados."
                        : "Nenhum produto cadastrado para esta marca."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProdutos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-mono text-xs">{produto.codigo || '-'}</TableCell>
                      <TableCell className="font-medium text-sm">{produto.descricao}</TableCell>
                      <TableCell className="text-sm">
                        {categorias.find(c => c.id === produto.categoria_id)?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{produto.linha || '-'}</TableCell>
                      <TableCell className="text-sm">{produto.quantidade_ml || '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(produto.preco ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-right text-sm">{Number(produto.preco_venda ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center text-sm">{produto.quantidade_pontos || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            produto.status === 'Ativo'
                              ? 'bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha'
                              : 'bg-sfb-terracota/60 hover:bg-sfb-terracota/70 text-sfb-baunilha'
                          }
                        >
                          {produto.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-white border-2 border-sfb-areia/60">
                            <DropdownMenuItem 
                              onClick={() => handleOpenForm(produto)}
                              className="gap-2 cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau"
                            >
                              <Edit2 className="h-4 w-4 text-sfb-terracota" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(produto)}
                              className="gap-2 cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau"
                            >
                              {produto.status === 'Ativo' ? (
                                <>
                                  <PauseCircle className="h-4 w-4 text-orange-500" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 text-sfb-salvia" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setProdutoToDelete(produto.id)}
                              className="gap-2 cursor-pointer hover:bg-red-50 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="bg-sfb-baunilha/30 border-t border-sfb-areia/60 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-sfb-cacau/70">
                Mostrando <span className="font-semibold text-sfb-cacau">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold text-sfb-cacau">{Math.min(currentPage * itemsPerPage, filteredProdutos.length)}</span> de <span className="font-semibold text-sfb-cacau">{filteredProdutos.length}</span> produtos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-sfb-areia/60 bg-white"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-sfb-areia/60 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 ${
                          currentPage === pageNum 
                            ? "bg-sfb-terracota text-white hover:bg-sfb-terracota/90" 
                            : "border-sfb-areia/60 bg-white text-sfb-cacau hover:bg-sfb-baunilha"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-sfb-areia/60 bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-sfb-areia/60 bg-white"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'} - {config.label}
            </DialogTitle>
          </DialogHeader>
          <ProdutoRevendaForm 
            marca={dbMarca}
            produto={editingProduto}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingProduto(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!produtoToDelete} onOpenChange={(open) => !open && setProdutoToDelete(null)}>
        <AlertDialogContent className="bg-white border-2 border-sfb-areia/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sfb-cacau font-display">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-sfb-areia/60 text-sfb-cacau hover:bg-sfb-baunilha">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
