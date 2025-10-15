import { useState, useMemo, useEffect, useRef } from "react";
import { FolderTree, Plus, Pencil, Trash2, Lock, Search, ChevronRight, ChevronDown, Maximize2, Minimize2, AlertTriangle, Download, Upload, Copy, History, FileSpreadsheet, Palette, Sparkles, HelpCircle, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

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
  cor?: string; // Nova: cor customizada
  icone?: string; // Nova: ícone Lucide
}

interface HistoricoAlteracao {
  id: string;
  categoriaId: string;
  acao: 'criado' | 'editado' | 'excluído' | 'desativado' | 'duplicado';
  usuario: string;
  dataHora: string;
  detalhes: string;
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
  const navigate = useNavigate();
  const [categorias, setCategorias] = useLocalStorage<CategoriaPlano[]>("sugarbox_categorias_plano", categoriasIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [desactivateDialogOpen, setDesactivateDialogOpen] = useState(false);
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaPlano | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndicador, setFilterIndicador] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("ativo");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [historico, setHistorico] = useLocalStorage<HistoricoAlteracao[]>("sugarbox_historico_categorias", []);
  
  // Inicialização automática das categorias
  useEffect(() => {
    if (categorias.length === 0) {
      setCategorias(categoriasIniciais);
      toast.success('✓ Sistema inicializado com 37 categorias padrão para confeitaria!', {
        duration: 5000
      });
    }
  }, []);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    indicador: "receita" as "receita" | "despesa" | "ativo" | "passivo",
    faixaDRE: "nao_aplicavel" as FaixaDRE,
    nivel: 1,
    categoriaPai: "",
    ativo: true,
    cor: "",
    icone: ""
  });

  // Adicionar ao histórico
  const adicionarHistorico = (
    categoriaId: string, 
    acao: HistoricoAlteracao['acao'], 
    detalhes: string
  ) => {
    const novaEntrada: HistoricoAlteracao = {
      id: `hist-${Date.now()}`,
      categoriaId,
      acao,
      usuario: "Usuário", // Pode ser integrado com sistema de auth
      dataHora: new Date().toISOString(),
      detalhes
    };
    setHistorico([novaEntrada, ...historico].slice(0, 100)); // Manter últimas 100 entradas
  };

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
      ativo: true,
      cor: "",
      icone: ""
    });
    setEditingCategoria(null);
  };

  // Gerar próximo código disponível baseado na categoria pai
  const gerarProximoCodigo = (categoriaPaiId: string) => {
    if (!categoriaPaiId) {
      // Nível 1: pegar maior número usado + 1
      const codigosNivel1 = categorias
        .filter(c => !c.codigo.includes('.'))
        .map(c => parseInt(c.codigo));
      
      const maiorCodigo = Math.max(...codigosNivel1, 0);
      return (maiorCodigo + 1).toString();
    }
    
    const pai = categorias.find(c => c.id === categoriaPaiId);
    if (!pai) return "";
    
    // Buscar todos os filhos diretos
    const filhos = categorias.filter(c => {
      if (!c.codigo.startsWith(pai.codigo + '.')) return false;
      const partesFilho = c.codigo.split('.');
      const partesPai = pai.codigo.split('.');
      return partesFilho.length === partesPai.length + 1;
    });
    
    if (filhos.length === 0) {
      return pai.codigo + '.1';
    }
    
    // Pegar último número do código dos filhos
    const ultimosNumeros = filhos.map(f => {
      const partes = f.codigo.split('.');
      return parseInt(partes[partes.length - 1]);
    });
    
    const maiorNumero = Math.max(...ultimosNumeros);
    return pai.codigo + '.' + (maiorNumero + 1);
  };

  // Atualizar código quando categoria pai muda
  const handleCategoriaPaiChange = (paiId: string) => {
    if (paiId) {
      const pai = categorias.find(c => c.id === paiId);
      const codigo = gerarProximoCodigo(paiId);
      setFormData({ 
        ...formData, 
        categoriaPai: paiId,
        codigo: codigo,
        nivel: pai ? pai.nivel + 1 : 1
      });
    } else {
      setFormData({ 
        ...formData, 
        categoriaPai: "",
        codigo: "",
        nivel: 1
      });
    }
  };

  // Obter opções de faixa DRE baseadas no indicador
  const getFaixasDREPorIndicador = (indicador: string): { value: FaixaDRE; label: string }[] => {
    const faixasReceita = [
      { value: 'receita_bruta' as FaixaDRE, label: 'Receita Bruta' },
      { value: 'deducoes' as FaixaDRE, label: 'Deduções da Receita' },
      { value: 'receita_liquida' as FaixaDRE, label: 'Receita Líquida' },
      { value: 'outras_receitas' as FaixaDRE, label: 'Outras Receitas' },
      { value: 'nao_aplicavel' as FaixaDRE, label: 'Não Aplicável (categorias pai)' },
    ];

    const faixasDespesa = [
      { value: 'cmv' as FaixaDRE, label: 'CMV (Custo da Mercadoria Vendida)' },
      { value: 'despesas_operacionais' as FaixaDRE, label: 'Despesas Operacionais' },
      { value: 'despesas_administrativas' as FaixaDRE, label: 'Despesas Administrativas' },
      { value: 'despesas_vendas' as FaixaDRE, label: 'Despesas com Vendas' },
      { value: 'despesas_financeiras' as FaixaDRE, label: 'Despesas Financeiras' },
      { value: 'outras_despesas' as FaixaDRE, label: 'Outras Despesas' },
      { value: 'nao_aplicavel' as FaixaDRE, label: 'Não Aplicável (categorias pai)' },
    ];

    const faixasAtivo = [
      { value: 'nao_aplicavel' as FaixaDRE, label: 'Não Aplicável (Balanço Patrimonial)' },
    ];

    const faixasPassivo = [
      { value: 'nao_aplicavel' as FaixaDRE, label: 'Não Aplicável (Balanço Patrimonial)' },
    ];

    if (indicador === 'receita') return faixasReceita;
    if (indicador === 'despesa') return faixasDespesa;
    if (indicador === 'ativo') return faixasAtivo;
    if (indicador === 'passivo') return faixasPassivo;
    
    return [{ value: 'nao_aplicavel' as FaixaDRE, label: 'Não Aplicável' }];
  };

  // Validar categoria antes de salvar
  const validarCategoria = (): string[] => {
    const erros: string[] = [];
    
    // Código obrigatório
    if (!formData.codigo || formData.codigo.trim() === '') {
      erros.push('Código é obrigatório');
      return erros;
    }
    
    // Validar formato do código (X.Y.Z...)
    const regexCodigo = /^\d+(\.\d+)*$/;
    if (!regexCodigo.test(formData.codigo)) {
      erros.push('Código deve seguir o formato: 1 ou 1.1 ou 1.1.1');
    }
    
    // Verificar código único
    const codigoExistente = categorias.find(
      c => c.codigo === formData.codigo && c.id !== editingCategoria?.id
    );
    if (codigoExistente) {
      erros.push('Código já existe no sistema');
    }
    
    // Descrição obrigatória
    if (!formData.descricao || formData.descricao.trim() === '') {
      erros.push('Descrição é obrigatória');
    }
    
    // Validar hierarquia
    if (formData.categoriaPai) {
      const pai = categorias.find(c => c.id === formData.categoriaPai);
      if (!pai) {
        erros.push('Categoria pai não encontrada');
      } else {
        // Validar que código é filho do pai
        if (!formData.codigo.startsWith(pai.codigo + '.')) {
          erros.push('Código deve começar com o código da categoria pai');
        }
        
        // Validar nível máximo (4)
        const nivel = formData.codigo.split('.').length;
        if (nivel > 4) {
          erros.push('Nível máximo é 4 (ex: 1.2.3.4)');
        }
      }
    }
    
    return erros;
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
    
    // Validar
    const erros = validarCategoria();
    if (erros.length > 0) {
      toast.error(erros.join('\n'));
      return;
    }
    
    // Determinar nível
    const nivel = formData.codigo.split('.').length;
    
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
              nivel,
              updatedAt: new Date().toISOString() 
            }
          : c
      ));
      
      adicionarHistorico(
        editingCategoria.id, 
        'editado', 
        `Categoria "${formData.codigo} - ${formData.descricao}" atualizada`
      );
      
      toast.success("✓ Categoria atualizada com sucesso!");
    } else {
      const novaCategoria: CategoriaPlano = {
        id: `cat-${Date.now()}`,
        ...formData,
        nivel,
        editavel: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Adicionar e ordenar por código
      const novasCategorias = [...categorias, novaCategoria].sort((a, b) => {
        const partesA = a.codigo.split('.').map(Number);
        const partesB = b.codigo.split('.').map(Number);
        
        for (let i = 0; i < Math.max(partesA.length, partesB.length); i++) {
          const numA = partesA[i] || 0;
          const numB = partesB[i] || 0;
          if (numA !== numB) return numA - numB;
        }
        return 0;
      });
      
      setCategorias(novasCategorias);
      
      adicionarHistorico(
        novaCategoria.id, 
        'criado', 
        `Nova categoria "${formData.codigo} - ${formData.descricao}" criada`
      );
      
      toast.success("✓ Categoria criada com sucesso!");
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
      ativo: categoria.ativo,
      cor: categoria.cor || "",
      icone: categoria.icone || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!categoriaToDelete) return;
    
    const categoria = categorias.find(c => c.id === categoriaToDelete);
    
    if (!categoria) {
      toast.error("Categoria não encontrada!");
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
      return;
    }
    
    if (!categoria.editavel) {
      toast.error("Esta categoria não pode ser excluída!");
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
      return;
    }
    
    // Verificar se há categorias filhas
    const temFilhos = categorias.some(c => c.categoriaPai === categoriaToDelete);
    if (temFilhos) {
      toast.error("Não é possível excluir uma categoria que possui subcategorias. Exclua as subcategorias primeiro.");
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
      return;
    }
    
    // Aqui você pode verificar se há lançamentos vinculados
    // const temLancamentos = verificarLancamentos(categoriaToDelete);
    // Por enquanto, permite exclusão direta
      
      setCategorias(categorias.filter(c => c.id !== categoriaToDelete));
      
      adicionarHistorico(
        categoriaToDelete, 
        'excluído', 
        `Categoria "${categoria.codigo} - ${categoria.descricao}" excluída`
      );
      
      toast.success("✓ Categoria excluída com sucesso!");
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
  };

  const handleDesactivate = () => {
    if (!categoriaToDelete) return;
    
    setCategorias(categorias.map(c => 
      c.id === categoriaToDelete 
        ? { ...c, ativo: false, updatedAt: new Date().toISOString() }
        : c
    ));
    
    const categoria = categorias.find(c => c.id === categoriaToDelete);
    if (categoria) {
      adicionarHistorico(
        categoriaToDelete, 
        'desativado', 
        `Categoria "${categoria.codigo} - ${categoria.descricao}" desativada`
      );
    }
    
    toast.success("✓ Categoria desativada com sucesso!");
    setDesactivateDialogOpen(false);
    setCategoriaToDelete(null);
  };

  const confirmarExclusao = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    
    if (!categoria) return;
    
    // Verificar se tem filhos
    const temFilhos = categorias.some(c => c.categoriaPai === categoriaId);
    
    if (temFilhos) {
      toast.error("Não é possível excluir uma categoria que possui subcategorias. Exclua as subcategorias primeiro.");
      return;
    }
    
    // Verificar se tem lançamentos (simulado - você pode implementar a verificação real)
    // const temLancamentos = verificarLancamentos(categoriaId);
    const temLancamentos = false; // Por enquanto false
    
    if (temLancamentos) {
      setCategoriaToDelete(categoriaId);
      setDesactivateDialogOpen(true);
    } else {
      setCategoriaToDelete(categoriaId);
      setDeleteDialogOpen(true);
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

  // Estatísticas
  const stats = useMemo(() => {
    const receitas = categorias.filter(c => c.indicador === 'receita').length;
    const despesas = categorias.filter(c => c.indicador === 'despesa').length;
    return {
      receitas,
      despesas,
      total: categorias.length
    };
  }, [categorias]);

  // Filtros e busca
  const filteredCategorias = useMemo(() => {
    return categorias.filter(cat => {
      // Filtro de busca
      const matchSearch = searchTerm === "" || 
        cat.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por indicador
      const matchIndicador = filterIndicador === "todos" || cat.indicador === filterIndicador;
      
      // Filtro por status
      const matchStatus = filterStatus === "todos" ||
        (filterStatus === "ativo" && cat.ativo) ||
        (filterStatus === "inativo" && !cat.ativo);
      
      return matchSearch && matchIndicador && matchStatus;
    });
  }, [categorias, searchTerm, filterIndicador, filterStatus]);

  // Função para verificar se categoria tem filhos
  const hasChildren = (categoriaId: string) => {
    return categorias.some(c => c.categoriaPai === categoriaId);
  };

  // Função para toggle de expansão
  const toggleExpand = (categoriaId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoriaId)) {
      newExpanded.delete(categoriaId);
    } else {
      newExpanded.add(categoriaId);
    }
    setExpandedCategories(newExpanded);
  };

  // Expandir/recolher todas
  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedCategories(new Set());
    } else {
      const allIds = new Set(categorias.filter(c => hasChildren(c.id)).map(c => c.id));
      setExpandedCategories(allIds);
    }
    setExpandAll(!expandAll);
  };

  // Renderizar categorias hierarquicamente (recursivo)
  const renderCategoriaRow = (categoria: CategoriaPlano): JSX.Element[] => {
    const temFilhos = hasChildren(categoria.id);
    const estaExpandido = expandedCategories.has(categoria.id) || expandAll;
    const indentacao = (categoria.nivel - 1) * 24;
    const filhos = filteredCategorias.filter(c => c.categoriaPai === categoria.id);
    
    const rows: JSX.Element[] = [];
    
    // Linha principal
    rows.push(
      <TableRow 
        key={categoria.id} 
        className={`hover:bg-[#FAF7F5] transition ${!categoria.ativo ? 'opacity-50' : ''}`}
      >
        <TableCell className="font-mono text-sm text-[#6B5047]">
          <div className="flex items-center" style={{ paddingLeft: `${indentacao}px` }}>
            {temFilhos && (
              <button 
                onClick={() => toggleExpand(categoria.id)}
                className="mr-2 text-[#D89B8C] hover:text-[#B87C6D] transition-transform"
              >
                {estaExpandido ? 
                  <ChevronDown className="h-4 w-4" /> :
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
            )}
            {!temFilhos && <span className="w-6 inline-block" />}
            {categoria.codigo}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className={`
              ${categoria.nivel === 1 ? 'font-bold text-base' : ''}
              ${categoria.nivel === 2 ? 'font-semibold text-sm' : ''}
              ${categoria.nivel === 3 ? 'font-normal text-sm' : ''}
              ${categoria.nivel === 4 ? 'font-normal text-xs' : ''}
            `}>
              {categoria.descricao}
            </span>
            {!categoria.editavel && (
              <Lock className="h-3 w-3 text-[#9C8B82]" />
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge 
            variant="outline" 
            className={`${getIndicadorBadge(categoria.indicador)} border`}
          >
            {getIndicadorLabel(categoria.indicador)}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-[#9C8B82]">
          {getFaixaDRELabel(categoria.faixaDRE)}
        </TableCell>
        <TableCell className="text-right">
          {categoria.editavel ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => duplicarCategoria(categoria.id)}
                className="h-8 w-8"
                title="Duplicar categoria"
              >
                <Copy className="h-4 w-4 text-[#7BA8D8]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(categoria)}
                className="h-8 w-8 hover:bg-[#F5E6E0]"
              >
                <Pencil className="h-4 w-4 text-[#D89B8C]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => confirmarExclusao(categoria.id)}
                className="h-8 w-8 hover:bg-[#FFEBEE]"
              >
                <Trash2 className="h-4 w-4 text-[#D88B8B]" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-[#9C8B82]">Sistema</span>
          )}
        </TableCell>
      </TableRow>
    );
    
    // Filhos (recursivamente)
    if (estaExpandido && temFilhos) {
      filhos.forEach(filho => {
        rows.push(...renderCategoriaRow(filho));
      });
    }
    
    return rows;
  };

  // Categorias raiz (nível 1) para iniciar a renderização
  const categoriasRaiz = useMemo(() => {
    return filteredCategorias.filter(c => c.nivel === 1);
  }, [filteredCategorias]);

  // Badge de indicador com cores específicas
  const getIndicadorBadge = (indicador: string) => {
    const styles = {
      receita: "bg-[#E8F5E9] text-[#388E3C] border-[#8BA888]",
      despesa: "bg-[#FFEBEE] text-[#C62828] border-[#D88B8B]",
      ativo: "bg-[#E3F2FD] text-[#1976D2] border-[#7BA8D8]",
      passivo: "bg-[#FFF3E0] text-[#E65100] border-[#E5C89F]"
    };
    return styles[indicador as keyof typeof styles] || "";
  };

  // Exportar categorias para JSON
  const exportarCategorias = () => {
    const json = JSON.stringify(categorias, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const dataAtual = new Date().toISOString().split('T')[0];
    link.download = `categorias-plano-contas-${dataAtual}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('✓ Categorias exportadas com sucesso!');
  };

  // Importar categorias de JSON
  const importarCategorias = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const resultado = e.target?.result as string;
        const categoriasImportadas = JSON.parse(resultado);
        
        // Validar estrutura
        if (!Array.isArray(categoriasImportadas)) {
          throw new Error('Arquivo inválido: não é uma lista de categorias');
        }
        
        // Validar cada categoria
        categoriasImportadas.forEach((cat: any, index: number) => {
          if (!cat.codigo || !cat.descricao || !cat.indicador) {
            throw new Error(`Categoria ${index + 1} está incompleta`);
          }
        });
        
        // Confirmar importação
        if (window.confirm(
          `Foram encontradas ${categoriasImportadas.length} categorias.\n\n` +
          `Isso vai SUBSTITUIR todas as ${categorias.length} categorias atuais.\n\n` +
          `Deseja continuar?`
        )) {
          setCategorias(categoriasImportadas);
          toast.success(`✓ ${categoriasImportadas.length} categorias importadas com sucesso!`);
        }
        
      } catch (error: any) {
        toast.error('Erro ao importar arquivo: ' + error.message);
      }
    };
    
    reader.readAsText(file);
    
    // Limpar o input para permitir importar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Duplicar categoria
  const duplicarCategoria = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return;

    const novaCopia: CategoriaPlano = {
      ...categoria,
      id: `cat-${Date.now()}`,
      codigo: categoria.codigo + '-copia',
      descricao: categoria.descricao + ' (Cópia)',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCategorias([...categorias, novaCopia]);
    adicionarHistorico(novaCopia.id, 'duplicado', `Duplicada de ${categoria.codigo}`);
    toast.success(`✓ Categoria "${categoria.descricao}" duplicada com sucesso!`);
  };

  // Importar de Excel
  const importarExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validar e converter dados
        const categoriasImportadas: CategoriaPlano[] = jsonData.map((row: any, index) => {
          if (!row.codigo || !row.descricao || !row.indicador) {
            throw new Error(`Linha ${index + 2} está incompleta`);
          }

          return {
            id: `cat-${Date.now()}-${index}`,
            codigo: row.codigo.toString(),
            descricao: row.descricao,
            indicador: row.indicador.toLowerCase(),
            faixaDRE: row.faixaDRE || 'nao_aplicavel',
            nivel: row.codigo.split('.').length,
            ativo: row.ativo !== false,
            editavel: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        if (window.confirm(
          `Foram encontradas ${categoriasImportadas.length} categorias no Excel.\n\n` +
          `Isso vai ADICIONAR estas categorias às existentes.\n\n` +
          `Deseja continuar?`
        )) {
          setCategorias([...categorias, ...categoriasImportadas]);
          toast.success(`✓ ${categoriasImportadas.length} categorias importadas do Excel!`);
        }

      } catch (error: any) {
        toast.error('Erro ao importar Excel: ' + error.message);
      }
    };
    
    reader.readAsBinaryString(file);
    
    if (excelInputRef.current) {
      excelInputRef.current.value = '';
    }
  };

  // Exportar template Excel
  const exportarTemplateExcel = () => {
    const templateData = [
      {
        codigo: '1',
        descricao: 'RECEITAS',
        indicador: 'receita',
        faixaDRE: 'nao_aplicavel',
        ativo: true
      },
      {
        codigo: '1.1',
        descricao: 'Receita Bruta de Vendas',
        indicador: 'receita',
        faixaDRE: 'receita_bruta',
        ativo: true
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorias');
    
    XLSX.writeFile(workbook, 'template-categorias.xlsx');
    toast.success('✓ Template Excel baixado com sucesso!');
  };

  // Salvar como template
  const salvarTemplate = () => {
    const nomeTemplate = prompt('Digite um nome para este template:');
    if (!nomeTemplate) return;

    const templates = JSON.parse(localStorage.getItem('sugarbox_templates_categorias') || '{}');
    templates[nomeTemplate] = categorias;
    localStorage.setItem('sugarbox_templates_categorias', JSON.stringify(templates));
    
    toast.success(`✓ Template "${nomeTemplate}" salvo com sucesso!`);
  };

  // Carregar template
  const carregarTemplate = (nomeTemplate: string) => {
    const templates = JSON.parse(localStorage.getItem('sugarbox_templates_categorias') || '{}');
    const template = templates[nomeTemplate];
    
    if (!template) {
      toast.error('Template não encontrado!');
      return;
    }

    if (window.confirm(
      `Isso vai SUBSTITUIR todas as categorias atuais pelo template "${nomeTemplate}".\n\nDeseja continuar?`
    )) {
      setCategorias(template);
      toast.success(`✓ Template "${nomeTemplate}" carregado!`);
      setTemplatesDialogOpen(false);
    }
  };

  // Obter lista de templates
  const getTemplates = () => {
    const templates = JSON.parse(localStorage.getItem('sugarbox_templates_categorias') || '{}');
    return Object.keys(templates);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <BackButton to="/configuracoes" />
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#6B5047] mb-2">Categorias de Planos de Contas</h1>
            <p className="text-base text-[#9C8B82]">Estrutura contábil para organização financeira</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Botão de Ajuda */}
            <Button 
              variant="outline" 
              onClick={() => navigate('/financeiro/ajuda-categorias')}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Como usar?
            </Button>

            {/* Menu de Importação/Exportação */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-[#D89B8C] text-[#D89B8C] hover:bg-[#F5E6E0]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Importar/Exportar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-card">
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    onClick={exportarCategorias}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar JSON
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar JSON
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={exportarTemplateExcel}
                    className="w-full justify-start"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Baixar Template Excel
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => excelInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Excel
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Histórico */}
            <Button 
              variant="outline" 
              onClick={() => setHistoricoDialogOpen(true)}
              className="border-[#D89B8C] text-[#D89B8C] hover:bg-[#F5E6E0]"
            >
              <History className="mr-2 h-4 w-4" />
              Histórico
            </Button>

            {/* Templates */}
            <Button 
              variant="outline" 
              onClick={() => setTemplatesDialogOpen(true)}
              className="border-[#D89B8C] text-[#D89B8C] hover:bg-[#F5E6E0]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Templates
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importarCategorias}
              className="hidden"
            />
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={importarExcel}
              className="hidden"
            />
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#D89B8C] hover:bg-[#B87C6D] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto md:max-w-xl sm:max-w-full sm:h-full sm:max-h-full sm:rounded-none">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#6B5047]">
                  {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Categoria Pai */}
                <div className="space-y-2">
                  <Label htmlFor="categoriaPai" className="text-base font-semibold text-[#6B5047]">
                    Categoria Pai <span className="text-xs text-[#9C8B82] font-normal">(opcional)</span>
                  </Label>
                  <Select
                    value={formData.categoriaPai}
                    onValueChange={handleCategoriaPaiChange}
                    disabled={!!editingCategoria}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione uma categoria pai..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card max-h-[300px]">
                      <SelectItem value="">Nenhuma (Categoria Principal)</SelectItem>
                      {categoriasPais
                        .filter(c => c.nivel < 4)
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.codigo} - {cat.descricao}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Código */}
                <div className="space-y-2">
                  <Label htmlFor="codigo" className="text-base font-semibold text-[#6B5047]">
                    Código <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: 1.1.3"
                    className="h-11"
                    readOnly={!!formData.categoriaPai}
                    required
                  />
                  <p className="text-xs text-[#9C8B82]">
                    {formData.categoriaPai 
                      ? "Código gerado automaticamente com base na categoria pai" 
                      : "Digite o código manualmente (Ex: 1, 1.1, 1.1.1)"}
                  </p>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-base font-semibold text-[#6B5047]">
                    Descrição <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Vendas de Bolos"
                    maxLength={100}
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-[#9C8B82]">
                    {formData.descricao.length}/100 caracteres
                  </p>
                </div>

                {/* Indicador */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-[#6B5047]">
                    Indicador <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.indicador}
                    onValueChange={(value: "receita" | "despesa" | "ativo" | "passivo") => {
                      setFormData({ ...formData, indicador: value });
                      // Resetar faixa DRE ao mudar indicador
                      const faixas = getFaixasDREPorIndicador(value);
                      if (faixas.length > 0) {
                        setFormData(prev => ({ ...prev, indicador: value, faixaDRE: faixas[0].value }));
                      }
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-[#FAF7F5] cursor-pointer">
                      <RadioGroupItem value="receita" id="receita" />
                      <Label htmlFor="receita" className="cursor-pointer flex-1">
                        <div className="font-semibold text-[#388E3C]">Receita</div>
                        <div className="text-xs text-[#9C8B82]">Entradas financeiras</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-[#FAF7F5] cursor-pointer">
                      <RadioGroupItem value="despesa" id="despesa" />
                      <Label htmlFor="despesa" className="cursor-pointer flex-1">
                        <div className="font-semibold text-[#C62828]">Despesa</div>
                        <div className="text-xs text-[#9C8B82]">Saídas financeiras</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-[#FAF7F5] cursor-pointer">
                      <RadioGroupItem value="ativo" id="ativo" />
                      <Label htmlFor="ativo" className="cursor-pointer flex-1">
                        <div className="font-semibold text-[#1976D2]">Ativo</div>
                        <div className="text-xs text-[#9C8B82]">Bens e direitos</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-[#FAF7F5] cursor-pointer">
                      <RadioGroupItem value="passivo" id="passivo" />
                      <Label htmlFor="passivo" className="cursor-pointer flex-1">
                        <div className="font-semibold text-[#E65100]">Passivo</div>
                        <div className="text-xs text-[#9C8B82]">Obrigações</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Faixa no DRE */}
                <div className="space-y-2">
                  <Label htmlFor="faixaDRE" className="text-base font-semibold text-[#6B5047]">
                    Faixa no DRE <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.faixaDRE}
                    onValueChange={(value: FaixaDRE) => 
                      setFormData({ ...formData, faixaDRE: value })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione a faixa no DRE..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card max-h-[300px]">
                      {getFaixasDREPorIndicador(formData.indicador).map(faixa => (
                        <SelectItem key={faixa.value} value={faixa.value}>
                          {faixa.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#9C8B82]">
                    Opções filtradas baseadas no indicador selecionado
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-[#FAF7F5]">
                  <div className="flex items-center gap-2">
                    <div>
                      <Label htmlFor="ativo" className="text-base font-semibold text-[#6B5047] cursor-pointer">
                        Status
                      </Label>
                      <p className="text-xs text-[#9C8B82] mt-1">
                        Categorias inativas não aparecem em lançamentos
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-[#9C8B82] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-card max-w-xs">
                        <p className="text-sm">
                          Categorias inativas não podem ser usadas em novos lançamentos financeiros, 
                          mas os lançamentos antigos continuam vinculados a elas.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <span className="text-sm font-medium text-[#6B5047]">
                      {formData.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                
                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#D89B8C] hover:bg-[#B87C6D] text-white px-6"
                  >
                    {editingCategoria ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="text-sm text-[#9C8B82] mb-1">Receitas</div>
          <div className="text-3xl font-bold text-[#388E3C]">{stats.receitas}</div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="text-sm text-[#9C8B82] mb-1">Despesas</div>
          <div className="text-3xl font-bold text-[#C62828]">{stats.despesas}</div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="text-sm text-[#9C8B82] mb-1">Total</div>
          <div className="text-3xl font-bold text-[#6B5047]">{stats.total}</div>
        </div>
      </div>

      {/* Barra de Ferramentas */}
      <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9C8B82]" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterIndicador} onValueChange={setFilterIndicador}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="passivo">Passivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Apenas Ativos</SelectItem>
              <SelectItem value="inativo">Apenas Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExpandAll}
            className="w-full lg:w-auto"
          >
            {expandAll ? (
              <>
                <Minimize2 className="mr-2 h-4 w-4" />
                Recolher Todas
              </>
            ) : (
              <>
                <Maximize2 className="mr-2 h-4 w-4" />
                Expandir Todas
              </>
            )}
          </Button>
        </div>
      </div>

      {categoriasRaiz.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nenhuma categoria encontrada"
          description="Tente ajustar os filtros ou criar uma nova categoria"
          actionLabel="Nova Categoria"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <>
          {/* Tabela Desktop */}
          <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5E6E0] hover:bg-[#F5E6E0]">
                  <TableHead className="font-semibold text-sm uppercase text-[#6B5047]">Código</TableHead>
                  <TableHead className="font-semibold text-sm uppercase text-[#6B5047]">Descrição</TableHead>
                  <TableHead className="font-semibold text-sm uppercase text-[#6B5047]">Indicador</TableHead>
                  <TableHead className="font-semibold text-sm uppercase text-[#6B5047]">Faixa no DRE</TableHead>
                  <TableHead className="text-right font-semibold text-sm uppercase text-[#6B5047]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasRaiz.map(categoria => renderCategoriaRow(categoria))}
              </TableBody>
            </Table>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {categoriasRaiz.map(categoria => {
              const renderMobileCard = (cat: CategoriaPlano): JSX.Element[] => {
                const temFilhos = hasChildren(cat.id);
                const estaExpandido = expandedCategories.has(cat.id) || expandAll;
                const filhos = filteredCategorias.filter(c => c.categoriaPai === cat.id);
                const cards: JSX.Element[] = [];
                
                // Cor da borda baseada no indicador
                const getBorderColor = (indicador: string) => {
                  const colors = {
                    receita: '#8BA888',
                    despesa: '#D88B8B',
                    ativo: '#7BA8D8',
                    passivo: '#E5C89F'
                  };
                  return colors[indicador as keyof typeof colors] || '#E8E3DF';
                };
                
                cards.push(
                  <div 
                    key={cat.id} 
                    className="bg-card rounded-lg p-4 border-l-4 shadow-sm"
                    style={{ 
                      borderLeftColor: getBorderColor(cat.indicador),
                      marginLeft: `${(cat.nivel - 1) * 16}px`
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="font-mono text-sm font-semibold text-[#6B5047]">
                          {cat.codigo}
                        </span>
                        <h4 className={`text-[#6B5047] mt-1 ${cat.nivel === 1 ? 'font-bold' : cat.nivel === 2 ? 'font-semibold' : 'font-normal'}`}>
                          {cat.descricao}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {!cat.editavel && (
                          <Lock className="h-4 w-4 text-[#9C8B82]" />
                        )}
                        {temFilhos && (
                          <button 
                            onClick={() => toggleExpand(cat.id)}
                            className="text-[#D89B8C] hover:text-[#B87C6D]"
                          >
                            {estaExpandido ? 
                              <ChevronDown className="h-5 w-5" /> : 
                              <ChevronRight className="h-5 w-5" />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant="outline" 
                        className={`${getIndicadorBadge(cat.indicador)} border text-xs`}
                      >
                        {getIndicadorLabel(cat.indicador)}
                      </Badge>
                      <span className="text-xs text-[#9C8B82]">
                        {getFaixaDRELabel(cat.faixaDRE)}
                      </span>
                      {!cat.ativo && (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    
                    {cat.editavel && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(cat)}
                          className="flex-1 bg-[#D89B8C] hover:bg-[#B87C6D] text-white"
                          size="sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => confirmarExclusao(cat.id)}
                          className="border-2 border-[#D88B8B] text-[#D88B8B] hover:bg-[#FFEBEE]"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {!cat.editavel && (
                      <div className="text-xs text-[#9C8B82] text-center py-2">
                        Categoria do sistema
                      </div>
                    )}
                  </div>
                );
                
                // Renderizar filhos recursivamente
                if (estaExpandido && temFilhos) {
                  filhos.forEach(filho => {
                    cards.push(...renderMobileCard(filho));
                  });
                }
                
                return cards;
              };
              
              return renderMobileCard(categoria);
            })}
          </div>
        </>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />

      {/* Dialog de Confirmação de Desativação */}
      <AlertDialog open={desactivateDialogOpen} onOpenChange={setDesactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Categoria em Uso
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>Esta categoria possui lançamentos financeiros vinculados.</p>
              <p className="font-semibold">Você pode:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Desativar a categoria (recomendado)</li>
                <li>Reclassificar os lançamentos para outra categoria e depois excluir</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                Deseja desativar esta categoria? Ela não aparecerá em novos lançamentos, 
                mas os lançamentos antigos permanecerão vinculados.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDesactivateDialogOpen(false);
              setCategoriaToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDesactivate}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Histórico */}
      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Alterações
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {historico.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma alteração registrada ainda.
              </p>
            ) : (
              historico.map(item => (
                <div key={item.id} className="border rounded-lg p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          item.acao === 'criado' ? 'default' :
                          item.acao === 'editado' ? 'secondary' :
                          item.acao === 'excluído' ? 'destructive' :
                          item.acao === 'duplicado' ? 'outline' : 'secondary'
                        }>
                          {item.acao}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          por {item.usuario}
                        </span>
                      </div>
                      <p className="text-sm">{item.detalhes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(item.dataHora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Templates */}
      <Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gerenciar Templates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Button onClick={salvarTemplate} className="w-full bg-[#D89B8C] hover:bg-[#B87C6D]">
                <Plus className="mr-2 h-4 w-4" />
                Salvar Categorias Atuais como Template
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Templates Salvos</h3>
              {getTemplates().length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum template salvo ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {getTemplates().map(template => (
                    <div key={template} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <span className="font-medium">{template}</span>
                      <Button 
                        size="sm"
                        onClick={() => carregarTemplate(template)}
                        variant="outline"
                      >
                        Carregar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
