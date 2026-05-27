import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  FlaskConical,
  Cake,
  CalendarDays,
  ChevronLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LabelList,
} from "recharts";
import cadastrosHero from "@/assets/cadastros-hero-banner.jpg";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { useCategorias } from "@/hooks/useCategorias";
import { useReceitas } from "@/hooks/useReceitas";

const VINHO = "#5B1A2B";
const VINHO_ESCURO = "#3D0F1C";
const DOURADO = "#C9A14A";
const CREME = "#FDF6EE";
const CORAL = "#F28C82";
const PINK = "#E7A1AF";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tagPalette = [
  "bg-[#5B1A2B] text-[#FFF9F5]",
  "bg-[#C9A14A]/20 text-[#3D0F1C]",
  "bg-[#F28C82]/20 text-[#3D0F1C]",
];

export default function Cadastros() {
  const navigate = useNavigate();

  const { perfis } = useMaoObraPerfis();
  const { unidades } = useUnidadesMedida();
  const { categorias } = useCategorias();
  const { todasReceitas } = useReceitas();

  // Mini gráfico de barras: perfis (até 6)
  const barrasMaoObra = useMemo(
    () =>
      (perfis || []).slice(0, 6).map((p) => ({
        nome: p.nome,
        valor: Number(p.valor_hora || 0),
      })),
    [perfis]
  );

  // Mini tabela conversões (até 3)
  const conversoes = useMemo(() => {
    const list = (unidades || []).slice(0, 3);
    while (list.length < 3) {
      const fallback = [
        { nome: "Kg", sigla: "Kg" },
        { nome: "Litros", sigla: "L" },
        { nome: "Unidades", sigla: "un" },
      ][list.length];
      list.push({
        id: `fb-${list.length}`,
        usuario_id: "",
        nome: fallback.nome,
        sigla: fallback.sigla,
      } as any);
    }
    return list.slice(0, 3);
  }, [unidades]);

  // Tags categorias (até 7)
  const tagsCategorias = useMemo(
    () => (categorias || []).filter((c) => c.ativo).slice(0, 7),
    [categorias]
  );

  // Distribuição mão de obra por valor_hora
  const pieMaoObra = useMemo(() => {
    const data = (perfis || []).slice(0, 6).map((p) => ({
      name: p.nome,
      value: Number(p.valor_hora || 0),
    }));
    return data.filter((d) => d.value > 0);
  }, [perfis]);

  const pieColors = [VINHO, DOURADO, CORAL, PINK, VINHO_ESCURO, "#8B4A5C"];

  // Quantidade de receitas por categoria
  const barrasCategorias = useMemo(() => {
    const counts: Record<string, number> = {};
    (todasReceitas || []).forEach((r) => {
      const cat = r.categoria || "Sem categoria";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [todasReceitas]);

  const maxQtd = Math.max(1, ...barrasCategorias.map((b) => b.qtd));
  const corBarra = (q: number) => {
    const r = q / maxQtd;
    if (r >= 0.75) return VINHO_ESCURO;
    if (r >= 0.4) return VINHO;
    return DOURADO;
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-24">
      <div className="container mx-auto p-6 space-y-6">
        {/* HERO BANNER padronizado */}
        <HeroBanner
          image={cadastrosHero}
          title="Categorias de Receitas"
          subtitle="Organize seu cardápio em categorias"
          imageAlt="Cadastros"
        />

        {/* CARDS DE NAVEGAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 — Mão de Obra */}
          <button
            onClick={() => navigate("/configuracoes/precificacao/mao-de-obra")}
            className="group text-left bg-white border border-[#5B1A2B]/10 rounded-xl p-5 transition-all duration-200 hover:border-[#C9A14A]/50 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-[#FDF6EE] flex items-center justify-center shrink-0">
                <Scale className="h-6 w-6 text-[#5B1A2B]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-[#3D0F1C] leading-tight">
                  Valores de Mão de Obra
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Configure valor/hora e tempo de preparo das receitas
                </p>
              </div>
            </div>
            <div className="mt-3 h-[80px]">
              {barrasMaoObra.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barrasMaoObra} margin={{ top: 14, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradMaoObra" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VINHO} />
                        <stop offset="100%" stopColor={DOURADO} stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="nome" hide />
                    <YAxis hide />
                    <Bar dataKey="valor" fill="url(#gradMaoObra)" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="valor"
                        position="top"
                        formatter={(v: number) => v.toFixed(0)}
                        style={{ fill: VINHO_ESCURO, fontSize: 10, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">
                  Nenhum perfil cadastrado
                </div>
              )}
            </div>
          </button>

          {/* Card 2 — Unidades de Medidas */}
          <button
            onClick={() => navigate("/configuracoes/unidades-medida")}
            className="group text-left bg-white border border-[#5B1A2B]/10 rounded-xl p-5 transition-all duration-200 hover:border-[#C9A14A]/50 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-[#FDF6EE] flex items-center justify-center shrink-0">
                <FlaskConical className="h-6 w-6 text-[#5B1A2B]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-[#3D0F1C] leading-tight">
                  Unidades de Medidas
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Kg, litros, unidades e outras medidas usadas nas receitas
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {conversoes.map((u: any, i) => (
                <div
                  key={u.id || i}
                  className="grid grid-cols-5 items-center gap-2 text-[11px] text-[#3D0F1C] border-b border-[#5B1A2B]/[0.08] last:border-0 py-1"
                >
                  <span className="truncate">{u.nome}</span>
                  <span className="text-right">1</span>
                  <span className="text-center text-muted-foreground">=</span>
                  <span className="text-right">{u.sigla === "Kg" ? "1.000" : u.sigla === "L" ? "1.000" : "1"}</span>
                  <span className="text-muted-foreground truncate">{u.sigla}</span>
                </div>
              ))}
            </div>
          </button>

          {/* Card 3 — Categorias */}
          <button
            onClick={() => navigate("/configuracoes/categorias-receitas")}
            className="group text-left bg-white border border-[#5B1A2B]/10 rounded-xl p-5 transition-all duration-200 hover:border-[#C9A14A]/50 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-[#FDF6EE] flex items-center justify-center shrink-0">
                <Cake className="h-6 w-6 text-[#5B1A2B]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-[#3D0F1C] leading-tight">
                  Categorias de Receitas
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Organize seus produtos por categorias
                </p>
              </div>
            </div>
            <div className="mt-3">
              {tagsCategorias.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tagsCategorias.map((c, i) => (
                    <span
                      key={c.id}
                      className={`rounded-full text-[11px] px-2 py-0.5 ${tagPalette[i % tagPalette.length]}`}
                    >
                      {c.nome}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Nenhuma categoria cadastrada
                </p>
              )}
            </div>
          </button>
        </div>

        {/* RESUMO DE CADASTROS */}
        <div className="flex items-center gap-2 pt-2">
          <CalendarDays className="h-5 w-5 text-[#5B1A2B]" />
          <h2 className="font-display text-[20px] text-[#3D0F1C]">
            Resumo de Cadastros
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Painel Esquerdo - Distribuição Mão de Obra */}
          <div className="bg-white border border-[#5B1A2B]/10 rounded-xl p-5">
            <h3 className="font-display text-[15px] text-[#3D0F1C] mb-3">
              Distribuição de Mão de Obra por Tipo
            </h3>
            {pieMaoObra.length > 0 ? (
              <div className="grid grid-cols-5 gap-3 items-center">
                <div className="col-span-3 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieMaoObra}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {pieMaoObra.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatBRL(v)}
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "#5B1A2B22",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="col-span-2 space-y-2">
                  {pieMaoObra.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-2 text-[12px]">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: pieColors[i % pieColors.length] }}
                      />
                      <span className="flex-1 truncate text-[#3D0F1C]">{p.name}</span>
                      <span className="font-semibold text-[#3D0F1C]">{formatBRL(p.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Nenhum perfil cadastrado
              </div>
            )}
          </div>

          {/* Painel Direito - Receitas por Categoria */}
          <div className="bg-white border border-[#5B1A2B]/10 rounded-xl p-5">
            <h3 className="font-display text-[15px] text-[#3D0F1C] mb-3">
              Quantidade de Receitas por Categoria
            </h3>
            {barrasCategorias.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barrasCategorias} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#5B1A2B" strokeOpacity={0.05} />
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 10, fill: VINHO_ESCURO }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fontSize: 10, fill: VINHO_ESCURO }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "#5B1A2B22",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                      {barrasCategorias.map((b, i) => (
                        <Cell key={i} fill={corBarra(b.qtd)} />
                      ))}
                      <LabelList
                        dataKey="qtd"
                        position="top"
                        style={{ fill: VINHO_ESCURO, fontSize: 11, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma categoria cadastrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão flutuante voltar */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#5B1A2B] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
