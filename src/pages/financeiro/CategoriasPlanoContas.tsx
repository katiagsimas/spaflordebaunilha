import { useState, useMemo } from "react";
import { FolderTree, Plus, Pencil, Trash2, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type FaixaDRE = 'receita_bruta' | 'deducoes' | 'receita_liquida' | 
  'cmv' | 'lucro_bruto' | 
  'despesas_operacionais' | 'despesas_administrativas' | 
  'despesas_vendas' | 'despesas_financeiras' |
  'outras_receitas' | 'outras_despesas' |
  'lucro_operacional' | 'lucro_liquido' | 
  'nao_aplicavel';

interface CategoriaPlano {
  id: string;
  codigo: string;
  descricao: string;
  indicador: "receita" | "despesa" | "ativo" | "passivo";
  faixaDRE: FaixaDRE;
  nivel: number;
  categoriaPai?: string;
  ativo: boolean;
  editavel: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoriasIniciais: CategoriaPlano[] = [
  // 1. RECEITAS
  { id: 'cat-001', codigo: '1', descricao: 'RECEITAS', indicador: 'receita', faixaDRE: 'nao_aplicavel', nivel: 1, ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-002', codigo: '1.1', descricao: 'Receita Bruta de Vendas', indicador: 'receita', faixaDRE: 'receita_bruta', nivel: 2, categoriaPai: 'cat-001', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-003', codigo: '1.1.1', descricao: 'Vendas de Produtos', indicador: 'receita', faixaDRE: 'receita_bruta', nivel: 3, categoriaPai: 'cat-002', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-004', codigo: '1.1.2', descricao: 'Prestação de Serviços', indicador: 'receita', faixaDRE: 'receita_bruta', nivel: 3, categoriaPai: 'cat-002', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-005', codigo: '1.2', descricao: 'Deduções da Receita Bruta', indicador: 'despesa', faixaDRE: 'deducoes', nivel: 2, categoriaPai: 'cat-001', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-006', codigo: '1.2.1', descricao: 'Impostos sobre Vendas', indicador: 'despesa', faixaDRE: 'deducoes', nivel: 3, categoriaPai: 'cat-005', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-007', codigo: '1.2.2', descricao: 'Devoluções e Cancelamentos', indicador: 'despesa', faixaDRE: 'deducoes', nivel: 3, categoriaPai: 'cat-005', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-008', codigo: '1.2.3', descricao: 'Descontos Concedidos', indicador: 'despesa', faixaDRE: 'deducoes', nivel: 3, categoriaPai: 'cat-005', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-009', codigo: '1.3', descricao: 'Outras Receitas', indicador: 'receita', faixaDRE: 'outras_receitas', nivel: 2, categoriaPai: 'cat-001', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-010', codigo: '1.3.1', descricao: 'Receitas Financeiras', indicador: 'receita', faixaDRE: 'outras_receitas', nivel: 3, categoriaPai: 'cat-009', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-011', codigo: '1.3.2', descricao: 'Receitas Eventuais', indicador: 'receita', faixaDRE: 'outras_receitas', nivel: 3, categoriaPai: 'cat-009', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  
  // 2. CUSTOS
  { id: 'cat-012', codigo: '2', descricao: 'CUSTOS', indicador: 'despesa', faixaDRE: 'nao_aplicavel', nivel: 1, ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-013', codigo: '2.1', descricao: 'Custo dos Produtos Vendidos (CPV)', indicador: 'despesa', faixaDRE: 'cmv', nivel: 2, categoriaPai: 'cat-012', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-014', codigo: '2.1.1', descricao: 'Matéria-Prima (Ingredientes)', indicador: 'despesa', faixaDRE: 'cmv', nivel: 3, categoriaPai: 'cat-013', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-015', codigo: '2.1.2', descricao: 'Embalagens', indicador: 'despesa', faixaDRE: 'cmv', nivel: 3, categoriaPai: 'cat-013', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-016', codigo: '2.1.3', descricao: 'Mão de Obra Direta', indicador: 'despesa', faixaDRE: 'cmv', nivel: 3, categoriaPai: 'cat-013', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-017', codigo: '2.1.4', descricao: 'Insumos de Produção (Gás, Energia)', indicador: 'despesa', faixaDRE: 'cmv', nivel: 3, categoriaPai: 'cat-013', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  
  // 3. DESPESAS OPERACIONAIS
  { id: 'cat-018', codigo: '3', descricao: 'DESPESAS OPERACIONAIS', indicador: 'despesa', faixaDRE: 'nao_aplicavel', nivel: 1, ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-019', codigo: '3.1', descricao: 'Despesas Administrativas', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 2, categoriaPai: 'cat-018', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-020', codigo: '3.1.1', descricao: 'Salários e Encargos', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 3, categoriaPai: 'cat-019', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-021', codigo: '3.1.2', descricao: 'Aluguel', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 3, categoriaPai: 'cat-019', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-022', codigo: '3.1.3', descricao: 'Água, Luz e Telefone', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 3, categoriaPai: 'cat-019', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-023', codigo: '3.1.4', descricao: 'Material de Escritório', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 3, categoriaPai: 'cat-019', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-024', codigo: '3.1.5', descricao: 'Serviços de Terceiros', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 3, categoriaPai: 'cat-019', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-025', codigo: '3.1.6', descricao: 'Manutenção e Reparos', indicador: 'despesa', faixaDRE: 'despesas_administrativas', nivel: 3, categoriaPai: 'cat-019', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-026', codigo: '3.2', descricao: 'Despesas com Vendas', indicador: 'despesa', faixaDRE: 'despesas_vendas', nivel: 2, categoriaPai: 'cat-018', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-027', codigo: '3.2.1', descricao: 'Marketing e Publicidade', indicador: 'despesa', faixaDRE: 'despesas_vendas', nivel: 3, categoriaPai: 'cat-026', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-028', codigo: '3.2.2', descricao: 'Comissões de Vendas', indicador: 'despesa', faixaDRE: 'despesas_vendas', nivel: 3, categoriaPai: 'cat-026', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-029', codigo: '3.2.3', descricao: 'Frete e Entregas', indicador: 'despesa', faixaDRE: 'despesas_vendas', nivel: 3, categoriaPai: 'cat-026', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-030', codigo: '3.2.4', descricao: 'Taxas de Plataformas (Ifood, etc)', indicador: 'despesa', faixaDRE: 'despesas_vendas', nivel: 3, categoriaPai: 'cat-026', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-031', codigo: '3.3', descricao: 'Despesas Financeiras', indicador: 'despesa', faixaDRE: 'despesas_financeiras', nivel: 2, categoriaPai: 'cat-018', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-032', codigo: '3.3.1', descricao: 'Juros e Multas', indicador: 'despesa', faixaDRE: 'despesas_financeiras', nivel: 3, categoriaPai: 'cat-031', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-033', codigo: '3.3.2', descricao: 'Tarifas Bancárias', indicador: 'despesa', faixaDRE: 'despesas_financeiras', nivel: 3, categoriaPai: 'cat-031', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-034', codigo: '3.3.3', descricao: 'IOF e Taxas', indicador: 'despesa', faixaDRE: 'despesas_financeiras', nivel: 3, categoriaPai: 'cat-031', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-035', codigo: '3.4', descricao: 'Outras Despesas', indicador: 'despesa', faixaDRE: 'outras_despesas', nivel: 2, categoriaPai: 'cat-018', ativo: true, editavel: false, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-036', codigo: '3.4.1', descricao: 'Despesas Eventuais', indicador: 'despesa', faixaDRE: 'outras_despesas', nivel: 3, categoriaPai: 'cat-035', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'cat-037', codigo: '3.4.2', descricao: 'Perdas e Quebras', indicador: 'despesa', faixaDRE: 'outras_despesas', nivel: 3, categoriaPai: 'cat-035', ativo: true, editavel: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

export default function CategoriasPlanoContas() {
  const [categorias, setCategorias] = useLocalStorage<CategoriaPlano[]>("sugarbox_categorias_plano", categoriasIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaPlano | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    indicador: "receita" as "receita" | "despesa" | "ativo" | "passivo",
    faixaDRE: "nao_aplicavel" as FaixaDRE,
    nivel: 1,
    categoriaPai: "",
    ativo: true
  });

  const categoriasPais = useMemo(() => {
    return categorias.filter(c => c.ativo);
  }, [categorias]);

  const resetForm = () => {
    setFormData({ 
      codigo: "", 
      descricao: "", 
      indicador: "receita", 
      faixaDRE: "nao_aplicavel",
      nivel: 1,
      categoriaPai: "",
      ativo: true
    });
    setEditingCategoria(null);
  };

  const getFaixaDRELabel = (faixa: FaixaDRE) => {
    const labels: Record<FaixaDRE, string> = {
      receita_bruta: "Receita Bruta",
      deducoes: "Deduções",
      receita_liquida: "Receita Líquida",
      cmv: "CMV/CPV",
      lucro_bruto: "Lucro Bruto",
      despesas_operacionais: "Despesas Operacionais",
      despesas_administrativas: "Despesas Administrativas",
      despesas_vendas: "Despesas com Vendas",
      despesas_financeiras: "Despesas Financeiras",
      outras_receitas: "Outras Receitas",
      outras_despesas: "Outras Despesas",
      lucro_operacional: "Lucro Operacional",
      lucro_liquido: "Lucro Líquido",
      nao_aplicavel: "Não Aplicável"
    };
    return labels[faixa];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategoria) {
      if (!editingCategoria.editavel) {
        toast.error("Esta categoria não pode ser editada!");
        return;
      }
      
      setCategorias(categorias.map(c => 
        c.id === editingCategoria.id 
          ? { 
              ...editingCategoria, 
              ...formData, 
              updatedAt: new Date().toISOString() 
            }
          : c
      ));
      toast.success("Categoria atualizada com sucesso!");
    } else {
      const novaCategoria: CategoriaPlano = {
        id: `cat-${Date.now()}`,
        ...formData,
        editavel: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCategorias([...categorias, novaCategoria]);
      toast.success("Categoria criada com sucesso!");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (categoria: CategoriaPlano) => {
    if (!categoria.editavel) {
      toast.error("Esta categoria não pode ser editada!");
      return;
    }
    
    setEditingCategoria(categoria);
    setFormData({
      codigo: categoria.codigo,
      descricao: categoria.descricao,
      indicador: categoria.indicador,
      faixaDRE: categoria.faixaDRE,
      nivel: categoria.nivel,
      categoriaPai: categoria.categoriaPai || "",
      ativo: categoria.ativo
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (categoriaToDelete) {
      const categoria = categorias.find(c => c.id === categoriaToDelete);
      
      if (categoria && !categoria.editavel) {
        toast.error("Esta categoria não pode ser excluída!");
        setDeleteDialogOpen(false);
        setCategoriaToDelete(null);
        return;
      }
      
      // Verificar se há categorias filhas
      const temFilhos = categorias.some(c => c.categoriaPai === categoriaToDelete);
      if (temFilhos) {
        toast.error("Não é possível excluir uma categoria que possui subcategorias!");
        setDeleteDialogOpen(false);
        setCategoriaToDelete(null);
        return;
      }
      
      setCategorias(categorias.filter(c => c.id !== categoriaToDelete));
      toast.success("Categoria excluída com sucesso!");
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
    }
  };

  const getIndicadorLabel = (indicador: string) => {
    const labels = {
      receita: "Receita",
      despesa: "Despesa",
      ativo: "Ativo",
      passivo: "Passivo",
    };
    return labels[indicador as keyof typeof labels] || indicador;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <BackButton to="/financeiro/configuracoes" />
      </div>
      
      <PageHeader
        title="Categorias Planos de Contas"
        description="Gerencie as categorias para organizar seu plano de contas"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição da Categoria</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indicador">Indicador</Label>
                  <Select
                    value={formData.indicador}
                    onValueChange={(value: "receita" | "despesa" | "ativo" | "passivo") => 
                      setFormData({ ...formData, indicador: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="passivo">Passivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faixaDRE">Faixa no DRE</Label>
                  <Select
                    value={formData.faixaDRE}
                    onValueChange={(value: FaixaDRE) => 
                      setFormData({ ...formData, faixaDRE: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_aplicavel">Não Aplicável</SelectItem>
                      <SelectItem value="receita_bruta">Receita Bruta</SelectItem>
                      <SelectItem value="deducoes">Deduções</SelectItem>
                      <SelectItem value="receita_liquida">Receita Líquida</SelectItem>
                      <SelectItem value="cmv">CMV/CPV</SelectItem>
                      <SelectItem value="lucro_bruto">Lucro Bruto</SelectItem>
                      <SelectItem value="despesas_operacionais">Despesas Operacionais</SelectItem>
                      <SelectItem value="despesas_administrativas">Despesas Administrativas</SelectItem>
                      <SelectItem value="despesas_vendas">Despesas com Vendas</SelectItem>
                      <SelectItem value="despesas_financeiras">Despesas Financeiras</SelectItem>
                      <SelectItem value="outras_receitas">Outras Receitas</SelectItem>
                      <SelectItem value="outras_despesas">Outras Despesas</SelectItem>
                      <SelectItem value="lucro_operacional">Lucro Operacional</SelectItem>
                      <SelectItem value="lucro_liquido">Lucro Líquido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nivel">Nível Hierárquico</Label>
                  <Select
                    value={formData.nivel.toString()}
                    onValueChange={(value) => 
                      setFormData({ ...formData, nivel: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Nível 1 (Principal)</SelectItem>
                      <SelectItem value="2">Nível 2 (Subgrupo)</SelectItem>
                      <SelectItem value="3">Nível 3 (Conta)</SelectItem>
                      <SelectItem value="4">Nível 4 (Subconta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.nivel > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="categoriaPai">Categoria Pai</Label>
                    <Select
                      value={formData.categoriaPai}
                      onValueChange={(value) => 
                        setFormData({ ...formData, categoriaPai: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasPais
                          .filter(c => c.nivel < formData.nivel)
                          .map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.codigo} - {cat.descricao}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {categorias.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nenhuma categoria cadastrada"
          description="Comece criando sua primeira categoria de plano de contas"
          actionLabel="Nova Categoria"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Faixa no DRE</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id} className={!categoria.ativo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">
                    <span style={{ paddingLeft: `${(categoria.nivel - 1) * 20}px` }}>
                      {categoria.codigo}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span style={{ paddingLeft: `${(categoria.nivel - 1) * 20}px` }}>
                        {categoria.descricao}
                      </span>
                      {!categoria.editavel && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Nível {categoria.nivel}</Badge>
                  </TableCell>
                  <TableCell>{getIndicadorLabel(categoria.indicador)}</TableCell>
                  <TableCell>{getFaixaDRELabel(categoria.faixaDRE)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(categoria)}
                        disabled={!categoria.editavel}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCategoriaToDelete(categoria.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={!categoria.editavel}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
