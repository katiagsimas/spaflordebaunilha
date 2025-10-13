import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, Tag, Search, Grid3x3, List,
  ShoppingBag, ShoppingCart, Package, Gift, DollarSign, CreditCard,
  Wallet, PiggyBank, Home, Briefcase, Users, Laptop, Truck, Wrench,
  Shield, Award, TrendingUp, Activity, Anchor, AlertCircle,
  MoreHorizontal, Receipt, Megaphone, FileText, CornerUpLeft,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';

// Mapa de ícones disponíveis
const iconesDisponiveis: { [key: string]: LucideIcon } = {
  ShoppingBag, ShoppingCart, Package, Gift, DollarSign, CreditCard,
  Wallet, PiggyBank, Home, Briefcase, Users, Laptop, Truck, Wrench,
  Shield, Award, TrendingUp, Activity, Anchor, AlertCircle, Plus,
  MoreHorizontal, Tag, Receipt, Megaphone, FileText, CornerUpLeft
};

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone: string;
  ativo: boolean;
  editavel: boolean;
  createdAt: string;
  updatedAt: string;
}

// Categorias pré-configuradas
const categoriasIniciais: CategoriaFinanceira[] = [
  // ========================================
  // RECEITAS (9 categorias)
  // ========================================
  {
    id: 'cat-rec-001',
    nome: 'Receitas com Vendas',
    tipo: 'receita',
    cor: '#8BA888',
    icone: 'ShoppingBag',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-002',
    nome: 'Receitas com Serviços',
    tipo: 'receita',
    cor: '#7FA68C',
    icone: 'Briefcase',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-003',
    nome: 'Receitas Financeiras',
    tipo: 'receita',
    cor: '#6BA888',
    icone: 'TrendingUp',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-004',
    nome: 'Receitas não Operacionais',
    tipo: 'receita',
    cor: '#90C49C',
    icone: 'PiggyBank',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-005',
    nome: 'Devoluções e Reembolsos',
    tipo: 'receita',
    cor: '#A8D5BA',
    icone: 'CornerUpLeft',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-006',
    nome: 'Comissões Recebidas',
    tipo: 'receita',
    cor: '#85C99C',
    icone: 'Award',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-007',
    nome: 'Aluguéis Recebidos',
    tipo: 'receita',
    cor: '#9BD4A8',
    icone: 'Home',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-008',
    nome: 'Descontos Obtidos',
    tipo: 'receita',
    cor: '#A5D9B3',
    icone: 'Tag',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-rec-009',
    nome: 'Outras Receitas',
    tipo: 'receita',
    cor: '#B5E0C0',
    icone: 'Plus',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },

  // ========================================
  // DESPESAS (15 categorias)
  // ========================================
  {
    id: 'cat-desp-001',
    nome: 'Despesas Fixas',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'Anchor',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-002',
    nome: 'Despesas Variáveis',
    tipo: 'despesa',
    cor: '#E09999',
    icone: 'Activity',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-003',
    nome: 'Despesas com Pessoal',
    tipo: 'despesa',
    cor: '#C67C7C',
    icone: 'Users',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-004',
    nome: 'Despesas Administrativas',
    tipo: 'despesa',
    cor: '#D49595',
    icone: 'FileText',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-005',
    nome: 'Despesas com Marketing',
    tipo: 'despesa',
    cor: '#E5A3A3',
    icone: 'Megaphone',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-006',
    nome: 'Despesas com Vendas',
    tipo: 'despesa',
    cor: '#D07878',
    icone: 'ShoppingCart',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-007',
    nome: 'Despesas Financeiras',
    tipo: 'despesa',
    cor: '#E8A8A8',
    icone: 'CreditCard',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-008',
    nome: 'Custos de Produção',
    tipo: 'despesa',
    cor: '#C86C6C',
    icone: 'Package',
    ativo: true,
    editavel: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-009',
    nome: 'Despesas com Impostos',
    tipo: 'despesa',
    cor: '#DC9090',
    icone: 'Receipt',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-010',
    nome: 'Despesas com Transporte',
    tipo: 'despesa',
    cor: '#E39E9E',
    icone: 'Truck',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-011',
    nome: 'Despesas com Manutenção',
    tipo: 'despesa',
    cor: '#D88484',
    icone: 'Wrench',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-012',
    nome: 'Despesas com Tecnologia',
    tipo: 'despesa',
    cor: '#EBACAC',
    icone: 'Laptop',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-013',
    nome: 'Despesas com Seguros',
    tipo: 'despesa',
    cor: '#D77E7E',
    icone: 'Shield',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-014',
    nome: 'Despesas não Operacionais',
    tipo: 'despesa',
    cor: '#EFB4B4',
    icone: 'AlertCircle',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat-desp-015',
    nome: 'Outras Despesas',
    tipo: 'despesa',
    cor: '#F2BCBC',
    icone: 'MoreHorizontal',
    ativo: true,
    editavel: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

const STORAGE_KEY = 'sugarbox_categorias_financeiras';

// Paletas de cores sugeridas
const coresReceitas = ['#8BA888', '#7FA68C', '#6BA888', '#90C49C', '#A8D5BA', '#85C99C', '#9BD4A8', '#A5D9B3', '#B5E0C0'];
const coresDespesas = ['#D88B8B', '#E09999', '#C67C7C', '#D49595', '#E5A3A3', '#D07878', '#E8A8A8', '#C86C6C', '#DC9090', '#E39E9E', '#D88484', '#EBACAC', '#D77E7E', '#EFB4B4', '#F2BCBC'];

export default function CategoriasFinanceiras() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [alertDialogAberto, setAlertDialogAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaFinanceira | null>(null);
  const [categoriaExcluindo, setCategoriaExcluindo] = useState<CategoriaFinanceira | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [visualizacao, setVisualizacao] = useState<'grade' | 'lista'>('grade');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'tipo'>('nome');
  
  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [cor, setCor] = useState('#D89B8C');
  const [icone, setIcone] = useState('Tag');
  const [ativo, setAtivo] = useState(true);
  const [erros, setErros] = useState<string[]>([]);

  // Carregar categorias do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCategorias(JSON.parse(stored));
    } else {
      // Inicializar com categorias padrão
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriasIniciais));
      setCategorias(categoriasIniciais);
      toast({
        title: '✓ Sistema Inicializado',
        description: `${categoriasIniciais.length} categorias essenciais carregadas`,
      });
    }
  }, []);

  const salvarCategorias = (novasCategorias: CategoriaFinanceira[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasCategorias));
    setCategorias(novasCategorias);
  };

  const resetarFormulario = () => {
    setNome('');
    setTipo('receita');
    setCor('#8BA888');
    setIcone('Tag');
    setAtivo(true);
    setErros([]);
    setCategoriaEditando(null);
  };

  const validarCategoria = (): boolean => {
    const novosErros: string[] = [];
    
    if (!nome || nome.trim() === '') {
      novosErros.push('Nome é obrigatório');
    }
    
    if (nome.length > 50) {
      novosErros.push('Nome deve ter no máximo 50 caracteres');
    }
    
    const nomeExiste = categorias.find(
      c => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== categoriaEditando?.id
    );
    if (nomeExiste) {
      novosErros.push('Já existe uma categoria com este nome');
    }
    
    if (!tipo) {
      novosErros.push('Selecione o tipo (Receita ou Despesa)');
    }
    
    if (!cor) {
      novosErros.push('Selecione uma cor');
    }
    
    if (cor && !/^#[0-9A-F]{6}$/i.test(cor)) {
      novosErros.push('Cor inválida (use formato #RRGGBB)');
    }
    
    if (!icone) {
      novosErros.push('Selecione um ícone');
    }
    
    setErros(novosErros);
    return novosErros.length === 0;
  };

  const abrirDialog = (categoria?: CategoriaFinanceira) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setNome(categoria.nome);
      setTipo(categoria.tipo);
      setCor(categoria.cor);
      setIcone(categoria.icone);
      setAtivo(categoria.ativo);
    } else {
      resetarFormulario();
    }
    setErros([]);
    setDialogAberto(true);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    resetarFormulario();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarCategoria()) {
      toast({
        title: 'Erro de Validação',
        description: erros[0],
        variant: 'destructive',
      });
      return;
    }

    if (categoriaEditando) {
      // Editar categoria existente
      const novasCategorias = categorias.map((cat) =>
        cat.id === categoriaEditando.id
          ? {
              ...cat,
              nome: nome.trim(),
              tipo,
              cor,
              icone,
              ativo,
              updatedAt: new Date().toISOString(),
            }
          : cat
      );
      salvarCategorias(novasCategorias);
      toast({
        title: '✓ Categoria Atualizada',
        description: `"${nome}" foi atualizada com sucesso`,
      });
    } else {
      // Criar nova categoria
      const novaCategoria: CategoriaFinanceira = {
        id: Date.now().toString(),
        nome: nome.trim(),
        tipo,
        cor,
        icone,
        ativo,
        editavel: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      salvarCategorias([...categorias, novaCategoria]);
      toast({
        title: '✓ Categoria Criada',
        description: `"${nome}" foi criada com sucesso`,
      });
    }

    fecharDialog();
  };

  const confirmarExclusao = (categoria: CategoriaFinanceira) => {
    if (!categoria.editavel) {
      toast({
        title: 'Ação não permitida',
        description: 'Categorias do sistema não podem ser excluídas',
        variant: 'destructive',
      });
      return;
    }
    setCategoriaExcluindo(categoria);
    setAlertDialogAberto(true);
  };

  const excluirCategoria = () => {
    if (!categoriaExcluindo) return;

    const novasCategorias = categorias.filter((cat) => cat.id !== categoriaExcluindo.id);
    salvarCategorias(novasCategorias);
    toast({
      title: '✓ Categoria Excluída',
      description: `"${categoriaExcluindo.nome}" foi excluída`,
    });
    setAlertDialogAberto(false);
    setCategoriaExcluindo(null);
  };

  // Filtrar e ordenar categorias
  let categoriasFiltradas = abaAtiva === 'todos'
    ? categorias
    : categorias.filter((cat) => cat.tipo === abaAtiva);

  // Aplicar busca
  if (busca) {
    const termo = busca.toLowerCase();
    categoriasFiltradas = categoriasFiltradas.filter(
      (cat) => cat.nome.toLowerCase().includes(termo)
    );
  }

  // Aplicar ordenação
  categoriasFiltradas = [...categoriasFiltradas].sort((a, b) => {
    if (ordenacao === 'nome') {
      return a.nome.localeCompare(b.nome);
    } else {
      return a.tipo.localeCompare(b.tipo);
    }
  });

  const stats = {
    total: categorias.length,
    receitas: categorias.filter((c) => c.tipo === 'receita').length,
    despesas: categorias.filter((c) => c.tipo === 'despesa').length,
  };

  // Renderizar ícone da categoria
  const renderIcone = (nomeIcone: string, className = 'h-10 w-10') => {
    const IconComponent = iconesDisponiveis[nomeIcone] || Tag;
    return <IconComponent className={className} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Categorias Financeiras"
        description="Organize suas receitas e despesas de forma simples"
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg p-6 shadow-soft border-l-4 border-success">
          <p className="text-sm text-muted-foreground mb-1">Receitas</p>
          <p className="text-3xl font-bold text-success">{stats.receitas}</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-soft border-l-4 border-error">
          <p className="text-sm text-muted-foreground mb-1">Despesas</p>
          <p className="text-3xl font-bold text-error">{stats.despesas}</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-soft border-l-4 border-primary">
          <p className="text-sm text-muted-foreground mb-1">Total</p>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </div>
      </div>

      {/* Abas */}
      <Tabs value={abaAtiva} onValueChange={(v) => setAbaAtiva(v as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="todos">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="receita">Receitas ({stats.receitas})</TabsTrigger>
          <TabsTrigger value="despesa">Despesas ({stats.despesas})</TabsTrigger>
        </TabsList>

        {/* Barra de Ferramentas */}
        <div className="bg-card rounded-lg p-4 mt-4 shadow-soft">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 items-center flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={ordenacao} onValueChange={(v: 'nome' | 'tipo') => setOrdenacao(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Ordenar: Nome</SelectItem>
                  <SelectItem value="tipo">Ordenar: Tipo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={visualizacao === 'grade' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setVisualizacao('grade')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={visualizacao === 'lista' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setVisualizacao('lista')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Visualização em Grade */}
        {visualizacao === 'grade' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {categoriasFiltradas.map((categoria) => (
              <div
                key={categoria.id}
                className="bg-card rounded-xl p-6 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `4px solid ${categoria.cor}` }}
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="mb-3" style={{ color: categoria.cor }}>
                    {renderIcone(categoria.icone, 'h-10 w-10')}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    {categoria.nome}
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      categoria.tipo === 'receita'
                        ? 'border-success text-success bg-success/10'
                        : 'border-error text-error bg-error/10'
                    }
                  >
                    {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
                <div className="flex gap-2 justify-center pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirDialog(categoria)}
                    disabled={!categoria.editavel}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmarExclusao(categoria)}
                    disabled={!categoria.editavel}
                    className="text-error hover:text-error"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visualização em Lista */}
        {visualizacao === 'lista' && (
          <div className="bg-card rounded-lg shadow-soft overflow-hidden mt-6">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Ícone</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Nome</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Tipo</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Cor</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoriasFiltradas.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-muted/30 transition">
                    <td className="py-4 px-6">
                      <div style={{ color: categoria.cor }}>
                        {renderIcone(categoria.icone, 'h-6 w-6')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-foreground">{categoria.nome}</span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant="outline"
                        className={
                          categoria.tipo === 'receita'
                            ? 'border-success text-success bg-success/10'
                            : 'border-error text-error bg-error/10'
                        }
                      >
                        {categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <span className="text-xs text-muted-foreground">{categoria.cor}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirDialog(categoria)}
                          disabled={!categoria.editavel}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmarExclusao(categoria)}
                          disabled={!categoria.editavel}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {categoriasFiltradas.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma categoria encontrada
              </div>
            )}
          </div>
        )}
      </Tabs>

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {categoriaEditando
                ? 'Modifique os dados da categoria financeira'
                : 'Crie uma nova categoria para organizar suas finanças'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              {/* Erros de validação */}
              {erros.length > 0 && (
                <div className="bg-error/10 border border-error rounded-lg p-3">
                  <ul className="text-sm text-error space-y-1">
                    {erros.map((erro, i) => (
                      <li key={i}>• {erro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Despesas com Alimentação"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {nome.length}/50 caracteres
                </p>
              </div>

              {/* Tipo */}
              <div className="space-y-3">
                <Label>Tipo *</Label>
                <RadioGroup value={tipo} onValueChange={(v: 'receita' | 'despesa') => setTipo(v)}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2 flex-1 border-2 border-success/30 rounded-lg p-3 hover:border-success transition">
                      <RadioGroupItem value="receita" id="receita" />
                      <Label htmlFor="receita" className="flex items-center gap-2 cursor-pointer flex-1">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">Receita</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1 border-2 border-error/30 rounded-lg p-3 hover:border-error transition">
                      <RadioGroupItem value="despesa" id="despesa" />
                      <Label htmlFor="despesa" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Activity className="h-4 w-4 text-error" />
                        <span className="text-error font-medium">Despesa</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Ícone */}
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <Select value={icone} onValueChange={setIcone}>
                  <SelectTrigger id="icone">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {renderIcone(icone, 'h-4 w-4')}
                        <span>{icone}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-popover z-50">
                    {Object.keys(iconesDisponiveis).map((nomeIcone) => (
                      <SelectItem key={nomeIcone} value={nomeIcone}>
                        <div className="flex items-center gap-2">
                          {renderIcone(nomeIcone, 'h-4 w-4')}
                          <span>{nomeIcone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cor */}
              <div className="space-y-2">
                <Label htmlFor="cor">Cor de Identificação</Label>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="cor"
                      type="color"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      placeholder="#D89B8C"
                      className="flex-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Cores sugeridas:</p>
                    <div className="flex flex-wrap gap-2">
                      {(tipo === 'receita' ? coresReceitas : coresDespesas).map((corSugerida) => (
                        <button
                          key={corSugerida}
                          type="button"
                          onClick={() => setCor(corSugerida)}
                          className="w-8 h-8 rounded border-2 border-border hover:border-primary transition"
                          style={{ backgroundColor: corSugerida }}
                          title={corSugerida}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={(checked) => setAtivo(checked as boolean)}
                />
                <Label
                  htmlFor="ativo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Categoria ativa
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Categorias inativas não aparecem em novos lançamentos
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={fecharDialog}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {categoriaEditando ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Exclusão */}
      <AlertDialog open={alertDialogAberto} onOpenChange={setAlertDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoriaExcluindo?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirCategoria} className="bg-error hover:bg-error/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
