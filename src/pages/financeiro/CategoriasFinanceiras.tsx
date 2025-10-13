import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';

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

// Categorias pré-configuradas para confeitaria
const categoriasIniciais: CategoriaFinanceira[] = [
  // RECEITAS
  {
    id: '1',
    nome: 'Vendas de Produtos',
    tipo: 'receita',
    cor: '#8BA888',
    icone: 'ShoppingCart',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'Prestação de Serviços',
    tipo: 'receita',
    cor: '#8BA888',
    icone: 'Briefcase',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    nome: 'Outras Receitas',
    tipo: 'receita',
    cor: '#8BA888',
    icone: 'PlusCircle',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // DESPESAS
  {
    id: '4',
    nome: 'Matéria-Prima',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'Package',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    nome: 'Embalagens',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'Box',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    nome: 'Despesas Fixas',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'Home',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    nome: 'Marketing e Publicidade',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'Megaphone',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    nome: 'Salários e Encargos',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'Users',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    nome: 'Impostos e Taxas',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'FileText',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    nome: 'Despesas Financeiras',
    tipo: 'despesa',
    cor: '#D88B8B',
    icone: 'CreditCard',
    ativo: true,
    editavel: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'sugarbox_categorias_financeiras';

export default function CategoriasFinanceiras() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [alertDialogAberto, setAlertDialogAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaFinanceira | null>(null);
  const [categoriaExcluindo, setCategoriaExcluindo] = useState<CategoriaFinanceira | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  
  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [cor, setCor] = useState('#D89B8C');

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
    setCor('#D89B8C');
    setCategoriaEditando(null);
  };

  const abrirDialog = (categoria?: CategoriaFinanceira) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setNome(categoria.nome);
      setTipo(categoria.tipo);
      setCor(categoria.cor);
    } else {
      resetarFormulario();
    }
    setDialogAberto(true);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    resetarFormulario();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da categoria é obrigatório',
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
        icone: 'Tag',
        ativo: true,
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

  // Filtrar categorias
  const categoriasFiltradas =
    filtroTipo === 'todos'
      ? categorias
      : categorias.filter((cat) => cat.tipo === filtroTipo);

  const stats = {
    total: categorias.length,
    receitas: categorias.filter((c) => c.tipo === 'receita').length,
    despesas: categorias.filter((c) => c.tipo === 'despesa').length,
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

      {/* Barra de Ferramentas */}
      <div className="bg-card rounded-lg p-4 mb-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={filtroTipo === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroTipo('todos')}
            >
              Todos ({stats.total})
            </Button>
            <Button
              variant={filtroTipo === 'receita' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroTipo('receita')}
              className={filtroTipo === 'receita' ? '' : 'border-success text-success hover:bg-success/10'}
            >
              Receitas ({stats.receitas})
            </Button>
            <Button
              variant={filtroTipo === 'despesa' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroTipo('despesa')}
              className={filtroTipo === 'despesa' ? '' : 'border-error text-error hover:bg-error/10'}
            >
              Despesas ({stats.despesas})
            </Button>
          </div>
          <Button onClick={() => abrirDialog()} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Tabela Desktop */}
      <div className="hidden md:block bg-card rounded-lg shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Nome</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Tipo</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Cor</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categoriasFiltradas.map((categoria) => (
              <tr key={categoria.id} className="hover:bg-muted/30 transition">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{categoria.nome}</span>
                  </div>
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
                  {categoria.editavel ? (
                    <Badge variant="outline">Personalizada</Badge>
                  ) : (
                    <Badge variant="secondary">Sistema</Badge>
                  )}
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

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {categoriasFiltradas.map((categoria) => (
          <div key={categoria.id} className="bg-card rounded-lg p-4 shadow-soft">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{categoria.nome}</h3>
              </div>
              <div className="flex gap-1">
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
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cor:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  <span className="text-xs text-muted-foreground">{categoria.cor}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {categoria.editavel ? (
                  <Badge variant="outline">Personalizada</Badge>
                ) : (
                  <Badge variant="secondary">Sistema</Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {categoriasFiltradas.length === 0 && (
          <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
            Nenhuma categoria encontrada
          </div>
        )}
      </div>

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Vendas Online, Aluguel, etc"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={(value: 'receita' | 'despesa') => setTipo(value)}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor de Identificação</Label>
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
                  />
                </div>
              </div>
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
