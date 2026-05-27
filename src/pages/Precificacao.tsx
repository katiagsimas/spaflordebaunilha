import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalculosReceita } from "@/hooks/useCalculosReceita";
import { useCategorias } from "@/hooks/useCategorias";
import { usePlano } from "@/hooks/usePlano";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LoadingMascote } from "@/components/LoadingMascote";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import heroBanner from "@/assets/cardapio-hero-banner.jpg";
import iconIngredientes from "@/assets/cardapio-icon-ingredientes.png";
import iconEmbalagens from "@/assets/cardapio-icon-embalagens.png";
import iconPrePreparos from "@/assets/cardapio-icon-prepreparos.png";
import iconFicha from "@/assets/cardapio-icon-ficha.png";

const navCards = [
  {
    title: "Ingredientes",
    description: "Ingredientes com marca e preço",
    icon: iconIngredientes,
    url: "/precificacao/ingredientes",
  },
  {
    title: "Embalagens",
    description: "Embalagens com marca e preço",
    icon: iconEmbalagens,
    url: "/precificacao/embalagens",
  },
  {
    title: "Pré-Preparos",
    description: "Preparos intermediários para receitas",
    icon: iconPrePreparos,
    url: "/precificacao/pre-preparos",
  },
  {
    title: "Ficha Técnica",
    description: "Calcule Custos e Preços de Venda",
    icon: iconFicha,
    url: "/precificacao/ficha-tecnica",
  },
];

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function corMargem(pct: number) {
  if (pct >= 30) return "text-[#2e7d32]";
  if (pct >= 10) return "text-[#C9A14A]";
  return "text-[#F28C82]";
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#5B1A2B]/20 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-[#3D0F1C] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs text-[#3D0F1C]/80">
          <span
            className="inline-block w-2 h-2 rounded-sm mr-2 align-middle"
            style={{ backgroundColor: p.color }}
          />
          {p.name}: R$ {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export default function Precificacao() {
  const navigate = useNavigate();
  const { resumos, isLoading } = useCalculosReceita();
  const { categoriasAtivas } = useCategorias();
  const { rotaBloqueada } = usePlano();
  const { isAdmin } = useIsAdmin();

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  const cardsVisiveis = navCards.filter((c) => (isAdmin ? true : !rotaBloqueada(c.url)));

  const resumosFiltrados = useMemo(() => {
    return resumos
      .filter((r) => {
        const matchBusca = !busca || r.nome.toLowerCase().includes(busca.toLowerCase());
        const matchStatus =
          statusFiltro === "todos" || (r.cardapio || "inativo") === statusFiltro;
        const matchCategoria =
          categoriaFiltro === "todas" || (r.categoria || "") === categoriaFiltro;
        return matchBusca && matchStatus && matchCategoria;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [resumos, busca, statusFiltro, categoriaFiltro]);

  const chartData = useMemo(() => {
    // Distribui resumos em 12 buckets para visualizar a relação custo x preço médio
    const ativos = resumos.filter((r) => r.cardapio === "ativo");
    if (ativos.length === 0) {
      return MESES_ABREV.map((m) => ({ mes: m, custo: 0, preco: 0 }));
    }
    return MESES_ABREV.map((mes, i) => {
      const subset = ativos.filter((_, idx) => idx % 12 === i);
      const arr = subset.length ? subset : [ativos[i % ativos.length]];
      const custo = arr.reduce((s, r) => s + r.cmvReal, 0) / arr.length;
      const preco = arr.reduce((s, r) => s + r.valorVenda, 0) / arr.length;
      return { mes, custo: Number(custo.toFixed(2)), preco: Number(preco.toFixed(2)) };
    });
  }, [resumos]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1
          className="text-[36px] leading-tight font-normal text-[#3D0F1C]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Cardápio
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-block w-10 h-[1.5px] bg-[#C9A14A]" />
          <span className="italic text-[15px] text-[#C9A14A]">Gerencie seus Produtos</span>
        </div>
      </div>

      {/* Hero banner */}
      <div
        className="w-full rounded-xl overflow-hidden bg-[#FDF6EE]"
        style={{ height: 130 }}
      >
        <img
          src={heroBanner}
          alt="Cardápio"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Cards de navegação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsVisiveis.map((card) => (
          <button
            key={card.url}
            onClick={() => navigate(card.url)}
            className="bg-white border border-[#5B1A2B]/10 rounded-xl p-5 text-left cursor-pointer transition-all duration-200 hover:border-[#C9A14A]/50 hover:shadow-md flex items-center gap-3"
          >
            <img
              src={card.icon}
              alt=""
              className="w-11 h-11 object-contain flex-shrink-0"
              loading="lazy"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-[15px] text-[#3D0F1C] leading-tight">
                {card.title}
              </h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                {card.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Layout principal duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-4 items-stretch">
        {/* Coluna esquerda */}
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-[45%]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5B1A2B]/40" />
              <Input
                placeholder="Buscar no Cardápio..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 bg-white border-[#5B1A2B]/20 rounded-lg"
              />
            </div>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="bg-white border-[#5B1A2B]/20 rounded-lg sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="bg-white border-[#5B1A2B]/20 rounded-lg sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categoriasAtivas.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Análises */}
          <Card className="bg-white border-[#5B1A2B]/10 rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#5B1A2B]" />
              <h2
                className="text-[20px] text-[#3D0F1C]"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Análises de Preço e Custo
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-10">
                <LoadingMascote size={64} label="Carregando produtos..." />
              </div>
            ) : resumosFiltrados.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FDF6EE] border-b border-[#5B1A2B]/10">
                      <th className="text-left text-[12px] uppercase tracking-wide text-muted-foreground font-medium px-5 py-3">
                        Produto
                      </th>
                      <th className="text-right text-[12px] uppercase tracking-wide text-muted-foreground font-medium px-5 py-3">
                        Custo Total
                      </th>
                      <th className="text-right text-[12px] uppercase tracking-wide text-muted-foreground font-medium px-5 py-3">
                        Preço de Venda
                      </th>
                      <th className="text-right text-[12px] uppercase tracking-wide text-muted-foreground font-medium px-5 py-3">
                        Margem (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumosFiltrados.map((r) => (
                      <tr
                        key={r.receitaId}
                        className="border-b border-[#5B1A2B]/[0.05] hover:bg-[#FDF6EE]/40 cursor-pointer transition-colors"
                        onClick={() =>
                          navigate(`/precificacao/ficha-tecnica/editar/${r.receitaId}`)
                        }
                      >
                        <td className="px-5 py-3 text-[14px] text-[#3D0F1C] font-medium">
                          {r.nome}
                        </td>
                        <td className="px-5 py-3 text-[14px] text-[#3D0F1C] text-right">
                          R$ {r.cmvReal.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-5 py-3 text-[14px] text-[#3D0F1C] text-right">
                          R$ {r.valorVenda.toFixed(2).replace(".", ",")}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-[14px] text-right font-semibold",
                            corMargem(r.margemPercent),
                          )}
                        >
                          {r.margemPercent.toFixed(1).replace(".", ",")}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Coluna direita - gráfico */}
        <Card className="bg-white border-[#5B1A2B]/10 rounded-xl p-4 flex flex-col h-full min-h-[320px]">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#C9A14A]" />
              <span className="text-[12px] text-muted-foreground">Custo Total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#F28C82]" />
              <span className="text-[12px] text-muted-foreground">Preço méd</span>
            </div>
          </div>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="custoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A14A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A14A" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="precoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F28C82" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F28C82" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#5B1A2B"
                  strokeOpacity={0.05}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "#5B1A2B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5B1A2B" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="custo"
                  name="Custo Total"
                  stroke="#C9A14A"
                  strokeWidth={2}
                  fill="url(#custoGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="preco"
                  name="Preço médio"
                  stroke="#F28C82"
                  strokeWidth={2}
                  fill="url(#precoGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Botão flutuante voltar */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Voltar"
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#5B1A2B] text-white flex items-center justify-center shadow-lg hover:bg-[#3D0F1C] transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
