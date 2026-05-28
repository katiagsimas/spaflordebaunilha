import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoque } from '@/hooks/useEstoque';
import { LoadingState } from '@/components/LoadingState';
import { Package, AlertTriangle, Plus, SlidersHorizontal, Search, CalendarDays, Coins, PackageOpen } from 'lucide-react';
import heroBanner from '@/assets/estoque-hero-banner.jpg';
import { HeroBanner } from '@/components/HeroBanner';
import emptyPrateleira from '@/assets/estoque-empty-prateleira.png';
import valorEstoqueImg from '@/assets/estoque-valor-total.png';

export default function EstoqueDashboard() {
  const navigate = useNavigate();
  const { itens, loading, valorTotal, itensAbaixoMinimo } = useEstoque();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

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
      tone: 'text-[#3D0F1C]',
      iconWrap: 'bg-[#C9A14A]/15 ring-[#C9A14A]/40',
      iconColor: 'text-[#C9A14A]',
    },
    {
      label: 'Itens Cadastrados',
      value: itens.length.toString(),
      Icon: PackageOpen,
      tone: 'text-[#3D0F1C]',
      iconWrap: 'bg-[#5B1A2B]/10 ring-[#5B1A2B]/25',
      iconColor: 'text-[#5B1A2B]',
    },
    {
      label: 'Abaixo do Mínimo',
      value: itensAbaixoMinimo.length.toString(),
      Icon: AlertTriangle,
      tone: itensAbaixoMinimo.length > 0 ? 'text-[#F28C82]' : 'text-[#3D0F1C]',
      iconWrap:
        itensAbaixoMinimo.length > 0
          ? 'bg-[#F28C82]/20 ring-[#F28C82]/40'
          : 'bg-[#5B1A2B]/10 ring-[#5B1A2B]/25',
      iconColor: itensAbaixoMinimo.length > 0 ? 'text-[#F28C82]' : 'text-[#5B1A2B]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HERO BANNER padronizado */}
      <HeroBanner
        image={heroBanner}
        title="Estoque"
        subtitle="Controle o estoque de ingredientes e embalagens da sua confeitaria"
      />

      {/* AÇÕES */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          onClick={() => navigate('/estoque/entrada')}
          className="gap-2 rounded-lg bg-[#3D0F1C] text-white hover:bg-[#5B1A2B]"
        >
          <Plus className="h-4 w-4" /> Nova Entrada
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/estoque/ajuste')}
          className="gap-2 rounded-lg border-[#5B1A2B]/30 bg-white text-[#3D0F1C] hover:border-[#5B1A2B] hover:bg-[#FDF6EE]"
        >
          <SlidersHorizontal className="h-4 w-4" /> Ajuste Manual
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/estoque/movimentacoes')}
          className="gap-2 rounded-lg border-[#5B1A2B]/30 bg-white text-[#3D0F1C] hover:border-[#5B1A2B] hover:bg-[#FDF6EE]"
        >
          <Search className="h-4 w-4" /> Movimentações
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpis.map(({ label, value, Icon, tone, iconWrap, iconColor }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-[#5B1A2B]/10 bg-white p-5"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${iconWrap}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="font-body text-xs uppercase tracking-wide text-[#5B1A2B]/60">{label}</p>
              <p className={`mt-1 font-display text-[28px] font-semibold leading-none ${tone}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-[45%]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B1A2B]/40" />
          <Input
            placeholder="Buscar insumo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="rounded-lg border-[#5B1A2B]/20 bg-white pl-9 focus-visible:border-[#C9A14A]"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full rounded-lg border-[#5B1A2B]/20 bg-white md:w-48">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="ingrediente">Ingredientes</SelectItem>
            <SelectItem value="embalagem">Embalagens</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full rounded-lg border-[#5B1A2B]/20 bg-white md:w-48">
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
        <div className="rounded-xl border border-[#5B1A2B]/10 bg-white">
          <div className="flex items-center gap-2 border-b border-[#5B1A2B]/10 px-5 py-4">
            <CalendarDays className="h-5 w-5 text-[#5B1A2B]" />
            <h2 className="font-display text-lg text-[#3D0F1C]">Histórico de Movimentações</h2>
          </div>

          {itensFiltrados.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-body text-sm text-[#5B1A2B]/60">
                Nenhuma movimentação encontrada com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FDF6EE] text-left">
                    <th className="px-5 py-3 font-body text-xs font-medium uppercase tracking-wide text-[#5B1A2B]/70">
                      Insumo
                    </th>
                    <th className="px-5 py-3 text-right font-body text-xs font-medium uppercase tracking-wide text-[#5B1A2B]/70">
                      Valor no Estoque
                    </th>
                    <th className="px-5 py-3 text-right font-body text-xs font-medium uppercase tracking-wide text-[#5B1A2B]/70">
                      Ajuste do Mínimo
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
                        className={`border-b border-[#5B1A2B]/5 transition hover:bg-[#FDF6EE]/60 ${
                          idx % 2 === 1 ? 'bg-[#FDF6EE]/30' : 'bg-white'
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#5B1A2B]/50" />
                            <div className="min-w-0">
                              <p className="truncate font-body text-sm font-medium text-[#3D0F1C]">
                                {item.nome_insumo}
                              </p>
                              <p className="font-body text-[11px] text-[#5B1A2B]/50">
                                {Number(item.quantidade_atual).toLocaleString('pt-BR', {
                                  maximumFractionDigits: 2,
                                })}{' '}
                                {item.unidade} ·{' '}
                                {item.tipo === 'ingrediente' ? 'Ingrediente' : 'Embalagem'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-body text-sm text-[#3D0F1C]">
                          {valorItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {abaixoMinimo ? (
                            <Badge className="gap-1 rounded-md bg-[#F28C82]/20 font-body text-xs text-[#B23A2E] hover:bg-[#F28C82]/30">
                              <AlertTriangle className="h-3 w-3" /> Abaixo
                            </Badge>
                          ) : (
                            <span className="font-body text-sm text-[#5B1A2B]/70">— Ajustado</span>
                          )}
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
        <aside className="rounded-xl border border-[#5B1A2B]/10 bg-white p-6">
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
              <p className="mt-4 font-display text-lg leading-snug text-[#3D0F1C]">
                Nenhum insumo
                <br />
                cadastrado ainda
              </p>
              <Button
                onClick={() => navigate('/estoque/entrada')}
                className="mt-5 gap-2 rounded-lg bg-[#3D0F1C] text-white hover:bg-[#5B1A2B]"
              >
                <Plus className="h-4 w-4" /> Nova Entrada
              </Button>
            </div>
          ) : itensAbaixoMinimo.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#F28C82]" />
                <h3 className="font-display text-base text-[#3D0F1C]">Abaixo do mínimo</h3>
              </div>
              <ul className="space-y-2">
                {itensAbaixoMinimo.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#F28C82]/25 bg-[#F28C82]/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-medium text-[#3D0F1C]">
                        {item.nome_insumo}
                      </p>
                      <p className="font-body text-[11px] text-[#5B1A2B]/60">
                        {Number(item.quantidade_atual).toLocaleString('pt-BR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        {item.unidade}
                      </p>
                    </div>
                    <Badge className="rounded-md bg-[#F28C82]/30 font-body text-[10px] text-[#B23A2E] hover:bg-[#F28C82]/40">
                      Baixo
                    </Badge>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => navigate('/estoque/entrada')}
                className="w-full gap-2 rounded-lg border-[#5B1A2B]/30 text-[#3D0F1C] hover:border-[#5B1A2B] hover:bg-[#FDF6EE]"
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
              <p className="mt-4 font-display text-base leading-snug text-[#3D0F1C]">
                Estoque equilibrado
              </p>
              <p className="mt-1 font-body text-xs text-[#5B1A2B]/60">
                Nenhum insumo abaixo do mínimo.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
