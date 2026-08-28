import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveGroupId } from '@/lib/activeGroup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/LoadingState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Search, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import * as XLSX from '@/lib/xlsxShim';
import { BackButton } from '@/components/BackButton';
import { formatBRL } from '@/lib/formatUtils';
import { formatDateToISO } from '@/lib/dateUtils';

interface Utensilio {
  id: string;
  data_compra: string;
  descricao: string;
  quantidade: number;
  valor_compra: number;
}

const parseNumero = (valor: string) => {
  const limpo = (valor || '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
};

const formatarData = (data: string) => {
  if (!data) return '—';
  const [y, m, d] = data.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

export default function Utensilios() {
  const { toast } = useToast();
  const [itens, setItens] = useState<Utensilio[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Utensilio | null>(null);
  const [dataCompra, setDataCompra] = useState(formatDateToISO(new Date()));
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [valorCompra, setValorCompra] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [itemParaExcluir, setItemParaExcluir] = useState<Utensilio | null>(null);

  useEffect(() => {
    fetchItens();
  }, []);

  const fetchItens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('utensilios')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_compra', { ascending: false });

      if (error) throw error;
      setItens((data || []) as Utensilio[]);
    } catch (error) {
      console.error('Erro ao buscar utensílios:', error);
    } finally {
      setLoading(false);
    }
  };

  const itensFiltrados = useMemo(() => {
    const base = !termoBusca.trim()
      ? itens
      : itens.filter((i) => (i.descricao || '').toLowerCase().includes(termoBusca.toLowerCase()));
    return ordenarAlfabetico(base, (i) => i.descricao);
  }, [itens, termoBusca]);

  const paginacao = usePaginacao(itensFiltrados, 25);


  const valorIndividual = (item: Utensilio) => {
    const qtd = Number(item.quantidade) || 0;
    if (qtd <= 0) return 0;
    return Number(item.valor_compra) / qtd;
  };

  const handleAbrirModal = (item: Utensilio | null = null, duplicar = false) => {
    if (item) {
      setEditando(duplicar ? null : item);
      setDataCompra(item.data_compra?.split('T')[0] || formatDateToISO(new Date()));
      setDescricao(duplicar ? `${item.descricao} (cópia)` : item.descricao);
      setQuantidade(String(item.quantidade));
      setValorCompra(String(item.valor_compra).replace('.', ','));
    } else {
      setEditando(null);
      setDataCompra(formatDateToISO(new Date()));
      setDescricao('');
      setQuantidade('1');
      setValorCompra('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!descricao.trim()) {
      toast({ title: 'Descrição obrigatória', variant: 'destructive' });
      return;
    }
    const qtd = parseNumero(quantidade);
    if (qtd <= 0) {
      toast({ title: 'Quantidade deve ser maior que zero', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        data_compra: dataCompra,
        descricao: descricao.trim(),
        quantidade: qtd,
        valor_compra: parseNumero(valorCompra),
      };

      if (editando) {
        const { error } = await supabase
          .from('utensilios')
          .update(payload)
          .eq('id', editando.id);
        if (error) throw error;
        toast({ title: '✅ Item atualizado' });
      } else {
        const ownerGroupId = await getActiveGroupId(user.id);
        const { error } = await supabase.from('utensilios').insert({
          ...payload,
          usuario_id: user.id,
          owner_group_id: ownerGroupId,
        });
        if (error) throw error;
        toast({ title: '✅ Item cadastrado' });
      }

      setModalAberto(false);
      await fetchItens();
    } catch (error: any) {
      console.error('Erro ao salvar utensílio:', error);
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!itemParaExcluir) return;
    try {
      const { error } = await supabase.from('utensilios').delete().eq('id', itemParaExcluir.id);
      if (error) throw error;
      toast({ title: '✅ Item excluído' });
      await fetchItens();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } finally {
      setItemParaExcluir(null);
    }
  };

  const handleExportarExcel = () => {
    try {
      const dados = itensFiltrados.map((item) => ({
        'Data da Compra': formatarData(item.data_compra),
        'Descrição': item.descricao,
        'Quantidade': Number(item.quantidade),
        'Valor da Compra (R$)': Number(item.valor_compra).toFixed(2).replace('.', ','),
        'Valor Individual (R$)': valorIndividual(item).toFixed(2).replace('.', ','),
      }));

      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Utensilios');
      XLSX.writeFile(wb, `Utensilios_e_Mobiliario_${formatDateToISO(new Date())}.xlsx`);
      toast({ title: '✅ Exportado', description: 'Planilha exportada com sucesso!' });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({ title: 'Erro ao exportar', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingState message="Carregando Utensílios e Mobiliário" submessage="Preparando sua lista..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/cadastros" />
        </div>
        <div className="flex flex-col items-start">
          <h1 className="flex items-center gap-3 font-display text-3xl tracking-tight text-sfb-cacau sm:text-4xl">
            Utensílios e Mobiliário
            <span className="rounded-full bg-sfb-terracota px-3 py-1 font-body text-sm font-semibold text-sfb-baunilha">
              {itens.length}
            </span>
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-px w-12 bg-sfb-terracota" />
            <p className="text-sm font-body italic text-sfb-cacau/70">
              Registre compras de utensílios e mobiliário do seu espaço
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <Button
          onClick={() => handleAbrirModal()}
          className="bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
        <Button variant="outline" onClick={handleExportarExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data da Compra</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Valor da Compra</TableHead>
              <TableHead>Valor Individual</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itensFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {termoBusca
                    ? 'Nenhum item encontrado com esse termo.'
                    : 'Nenhum item cadastrado. Clique em "+ Novo Item".'}
                </TableCell>
              </TableRow>
            ) : (
              itensFiltrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatarData(item.data_compra)}</TableCell>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>{Number(item.quantidade)}</TableCell>
                  <TableCell>{formatBRL(Number(item.valor_compra))}</TableCell>
                  <TableCell className="font-semibold text-sfb-cacau">
                    {formatBRL(valorIndividual(item))}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAbrirModal(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAbrirModal(item, true)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setItemParaExcluir(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            <DialogDescription>
              O valor individual é calculado automaticamente (valor da compra ÷ quantidade).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data da Compra</Label>
              <Input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: Bacia para escalda-pés"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da Compra (R$)</Label>
                <Input
                  value={valorCompra}
                  onChange={(e) => setValorCompra(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Valor individual:{' '}
              <strong className="text-sfb-cacau">
                {formatBRL(
                  parseNumero(quantidade) > 0
                    ? parseNumero(valorCompra) / parseNumero(quantidade)
                    : 0,
                )}
              </strong>
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemParaExcluir} onOpenChange={(open) => !open && setItemParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item "{itemParaExcluir?.descricao}" será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
