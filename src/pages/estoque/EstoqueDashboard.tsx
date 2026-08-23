import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoque, type EstoqueItem } from '@/hooks/useEstoque';
import { LoadingState } from '@/components/LoadingState';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  SlidersHorizontal, 
  Search, 
  CalendarDays, 
  Coins, 
  PackageOpen,
  MoreVertical,
  Edit2,
  Trash,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HeroBanner } from '@/components/HeroBanner';
import { toast } from 'sonner';
import emptyPrateleira from '@/assets/estoque-empty-prateleira.png';
import valorEstoqueImg from '@/assets/estoque-valor-total.png';
import itensCadastradosImg from '@/assets/estoque-itens-cadastrados.png';
import abaixoMinimoImg from '@/assets/estoque-abaixo-minimo.png';

export default function EstoqueDashboard() {
  const navigate = useNavigate();
  const { 
    itens, 
    loading, 
    valorTotal, 
    itensAbaixoMinimo,
    updateEstoqueItem,
    deleteEstoqueItem,
    duplicateEstoqueItem 
  } = useEstoque();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Estados para exclusão/duplicação (edição agora navega)
  const [editando, setEditando] = useState(false);


  if (loading) return <LoadingState />;

  const itensFiltrados = itens.filter((item) => {
    const matchBusca = !busca || (item.nome_insumo || '').toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
    const abaixo = item.estoque_minimo != null && item.quantidade_atual < item.estoque_minimo;
    const zerado = item.quantidade_atual <= 0;
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'baixo' && abaixo) ||
      (filtroStatus === 'zerado' && zerado) ||
      (filtroStatus === 'normal' && !abaixo && !zerado);
    return matchBusca && matchTipo && matchStatus;
  });

  const kpis = [
    {
      label: 'Valor Total em Estoque',
      value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      Icon: Coins,
      image: valorEstoqueImg,
      tone: 'text-sfb-cacau',
      iconWrap: 'bg-sfb-terracota/15 ring-[#C98A75]/40',
      iconColor: 'text-sfb-terracota',
    },
    {
      label: 'Itens Cadastrados',
      value: itens.length.toString(),
      Icon: PackageOpen,
      image: itensCadastradosImg,
      tone: 'text-sfb-cacau',
      iconWrap: 'bg-sfb-cacau/10 ring-sfb-cacau/25',
      iconColor: 'text-sfb-cacau',
    },
    {
      label: 'Abaixo do Mínimo',
      value: itensAbaixoMinimo.length.toString(),
      Icon: AlertTriangle,
      image: abaixoMinimoImg,
      tone: itensAbaixoMinimo.length > 0 ? 'text-sfb-terracota' : 'text-sfb-cacau',
      iconWrap:
        itensAbaixoMinimo.length > 0
          ? 'bg-sfb-terracota/20 ring-[#C98A75]/40'
          : 'bg-sfb-cacau/10 ring-sfb-cacau/25',
      iconColor: itensAbaixoMinimo.length > 0 ? 'text-sfb-terracota' : 'text-sfb-cacau',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HERO BANNER padronizado - Imagem removida conforme solicitação */}
      <HeroBanner
        title="Estoque"
        subtitle="Controle o estoque de insumos e embalagens da sua confeitaria"
      />

      {/* AÇÕES */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          onClick={() => navigate('/estoque/entrada')}
          className="gap-2 rounded-lg bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90"
        >
          <Plus className="h-4 w-4" /> Nova Entrada
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/estoque/ajuste')}
          className="gap-2 rounded-lg border-sfb-cacau/30 bg-white text-sfb-cacau hover:border-sfb-cacau hover:bg-sfb-baunilha"
        >
          <SlidersHorizontal className="h-4 w-4" /> Ajuste Manual
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/estoque/movimentacoes')}
          className="gap-2 rounded-lg border-sfb-cacau/30 bg-white text-sfb-cacau hover:border-sfb-cacau hover:bg-sfb-baunilha"
        >
          <Search className="h-4 w-4" /> Movimentações
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpis.map(({ label, value, Icon, image, tone, iconWrap, iconColor }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-sfb-cacau/10 bg-white p-5"
          >
            {image ? (
              <img
                src={image}
                alt={label}
                className="h-12 w-12 shrink-0 object-contain"
              />
            ) : (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${iconWrap}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-body text-xs uppercase tracking-wide text-sfb-cacau/60">{label}</p>
              <p className={`mt-1 font-display text-[28px] font-semibold leading-none ${tone}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-[45%]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sfb-cacau/40" />
          <Input
            placeholder="Buscar insumo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="rounded-lg border-sfb-cacau/20 bg-white pl-9 focus-visible:border-sfb-terracota"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full rounded-lg border-sfb-cacau/20 bg-white md:w-48">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="ingrediente">Insumos</SelectItem>
            <SelectItem value="embalagem">Embalagens</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full rounded-lg border-sfb-cacau/20 bg-white md:w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="baixo">Abaixo do mínimo</SelectItem>
            <SelectItem value="zerado">Zerado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(260px,35%)]">
        {/* COLUNA ESQUERDA */}
        <div className="rounded-xl border border-sfb-cacau/10 bg-white">
          <div className="flex items-center gap-2 border-b border-sfb-cacau/10 px-5 py-4">
            <CalendarDays className="h-5 w-5 text-sfb-cacau" />
            <h2 className="font-display text-lg text-sfb-cacau">Histórico de Movimentações</h2>
          </div>

          {itensFiltrados.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-body text-sm text-sfb-cacau/60">
                Nenhuma movimentação encontrada com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sfb-baunilha text-left">
                    <th className="px-5 py-3 font-body text-xs font-medium uppercase tracking-wide text-sfb-cacau/70">
                      Descrição
                    </th>
                    <th className="px-5 py-3 text-right font-body text-xs font-medium uppercase tracking-wide text-sfb-cacau/70">
                      Valor no Estoque
                    </th>
                    <th className="px-5 py-3 text-right font-body text-xs font-medium uppercase tracking-wide text-sfb-cacau/70">
                      Total em Estoque
                    </th>
                    <th className="px-5 py-3 text-right font-body text-xs font-medium uppercase tracking-wide text-sfb-cacau/70">
                      Status / Mínimo
                    </th>
                    <th className="px-5 py-3 text-center font-body text-xs font-medium uppercase tracking-wide text-sfb-cacau/70">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item, idx) => {
                    const abaixoMinimo =
                      item.estoque_minimo != null && item.quantidade_atual < item.estoque_minimo;
                    const valorItem = item.quantidade_atual * item.custo_medio;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-sfb-cacau/5 transition hover:bg-sfb-baunilha/60 ${
                          idx % 2 === 1 ? 'bg-sfb-baunilha/30' : 'bg-white'
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-sfb-cacau/50" />
                            <div className="min-w-0">
                              <p className="truncate font-body text-sm font-medium text-sfb-cacau">
                                {item.nome_insumo}
                              </p>
                              <p className="font-body text-[11px] text-sfb-cacau/50">
                                {item.tipo === 'ingrediente' ? 'Insumo' : 'Embalagem'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-body text-sm text-sfb-cacau">
                          {valorItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-5 py-3 text-right font-body text-sm text-sfb-cacau">
                          {Number(item.quantidade_atual).toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                          })}{' '}
                          {item.unidade}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {abaixoMinimo ? (
                            <Badge className="gap-1 rounded-md bg-sfb-terracota/20 font-body text-xs text-sfb-terracota hover:bg-sfb-terracota/30">
                              <AlertTriangle className="h-3 w-3" /> Abaixo
                            </Badge>
                          ) : (
                            <span className="font-body text-sm text-sfb-cacau/70">
                              {item.estoque_minimo ? `Min: ${item.estoque_minimo}` : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-sfb-cacau/50 hover:text-sfb-cacau">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => navigate(`/estoque/entrada?edit=${item.id}`)}
                              >
                                <Edit2 className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => duplicateEstoqueItem(item)}
                              >
                                <Copy className="h-4 w-4" /> Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => {
                                  if (confirm('Deseja realmente excluir este item do estoque?')) {
                                    deleteEstoqueItem(item.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <aside className="rounded-xl border border-sfb-cacau/10 bg-white p-6">
          {itens.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <img
                src={emptyPrateleira}
                alt=""
                className="mx-auto h-40 w-auto object-contain"
                width={640}
                height={640}
                loading="lazy"
              />
              <p className="mt-4 font-display text-lg leading-snug text-sfb-cacau">
                Nenhum insumo
                <br />
                cadastrado ainda
              </p>
              <Button
                onClick={() => navigate('/estoque/entrada')}
                className="mt-5 gap-2 rounded-lg bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90"
              >
                <Plus className="h-4 w-4" /> Nova Entrada
              </Button>
            </div>
          ) : itensAbaixoMinimo.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-sfb-terracota" />
                <h3 className="font-display text-base text-sfb-cacau">Abaixo do mínimo</h3>
              </div>
              <ul className="space-y-2">
                {itensAbaixoMinimo.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-sfb-terracota/25 bg-sfb-terracota/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-medium text-sfb-cacau">
                        {item.nome_insumo}
                      </p>
                      <p className="font-body text-[11px] text-sfb-cacau/60">
                        {Number(item.quantidade_atual).toLocaleString('pt-BR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        {item.unidade}
                      </p>
                    </div>
                    <Badge className="rounded-md bg-sfb-terracota/30 font-body text-[10px] text-sfb-terracota hover:bg-sfb-terracota/40">
                      Baixo
                    </Badge>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => navigate('/estoque/entrada')}
                className="w-full gap-2 rounded-lg border-sfb-cacau/30 text-sfb-cacau hover:border-sfb-cacau hover:bg-sfb-baunilha"
              >
                <Plus className="h-4 w-4" /> Repor estoque
              </Button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <img
                src={emptyPrateleira}
                alt=""
                className="mx-auto h-40 w-auto object-contain opacity-90"
                width={640}
                height={640}
                loading="lazy"
              />
              <p className="mt-4 font-display text-base leading-snug text-sfb-cacau">
                Estoque equilibrado
              </p>
              <p className="mt-1 font-body text-xs text-sfb-cacau/60">
                Nenhum insumo abaixo do mínimo.
              </p>
            </div>
          )}
        </aside>
      </div>

    </div>
  );
}
