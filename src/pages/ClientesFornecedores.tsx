import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Truck,
  CalendarDays,
  Settings2,
  Phone,
  MessageCircle,
  User,
  Mail,
  Cake,
  Store,
  Search,
  Package,
  ChevronLeft,
  UserRound,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import { useClientes } from "@/hooks/useClientes";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useEstoque } from "@/hooks/useEstoque";
import heroBanner from "@/assets/clientes-fornecedores-hero.jpg";

const VINHO = "#5B1A2B";
const VINHO_ESCURO = "#3D0F1C";
const DOURADO = "#C9A14A";
const CREME = "#FDF6EE";
const CORAL = "#F28C82";
const PINK = "#E7A1AF";
const PIE_COLORS = [VINHO_ESCURO, VINHO, DOURADO, CORAL, PINK];
const BAR_COLORS = [VINHO_ESCURO, VINHO, "#8B4513", DOURADO];

function inicial(nome: string) {
  return (nome || "?").trim().charAt(0).toUpperCase();
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClientesFornecedores() {
  const navigate = useNavigate();
  const { clientes } = useClientes();
  const { fornecedores } = useFornecedores();
  const { itens: estoqueItens = [] } = (useEstoque() as any) || {};

  const clientesRecentes = useMemo(
    () =>
      [...(clientes || [])]
        .sort((a: any, b: any) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        )
        .slice(0, 4),
    [clientes]
  );

  const fornecedoresRecentes = useMemo(
    () =>
      [...(fornecedores || [])]
        .sort((a: any, b: any) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        )
        .slice(0, 4),
    [fornecedores]
  );

  const origemData = useMemo(() => {
    const map = new Map<string, number>();
    (clientes || []).forEach((c: any) => {
      const key = (c.tipo || c.origem || "Não informado").toString();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [clientes]);

  const estoqueChartData = useMemo(() => {
    return (estoqueItens || [])
      .map((it: any) => ({
        nome: (it.nome_insumo || "Insumo").slice(0, 10),
        nomeCompleto: it.nome_insumo || "Insumo",
        quantidade: Number(it.quantidade_atual || 0),
        unidade: it.unidade || "",
        valor: Number(it.quantidade_atual || 0) * Number(it.custo_medio || 0),
      }))
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 6);
  }, [estoqueItens]);

  const estoqueTotal = useMemo(
    () =>
      (estoqueItens || []).reduce(
        (acc: number, it: any) =>
          acc + Number(it.quantidade_atual || 0) * Number(it.custo_medio || 0),
        0
      ),
    [estoqueItens]
  );

  const placeholdersClientes = Math.max(0, 4 - clientesRecentes.length);
  const placeholdersFornecedores = Math.max(0, 4 - fornecedoresRecentes.length);

  return (
    <div className="flex-1" style={{ background: "#FFF9F5" }}>
      <div className="p-6 space-y-4">
        {/* HERO BANNER */}
        <div
          className="relative rounded-xl overflow-hidden border"
          style={{ borderColor: `${VINHO}1A`, height: 190 }}
        >
          <img
            src={heroBanner}
            alt="Clientes e Fornecedores"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(253,246,238,0.85) 0%, rgba(253,246,238,0.55) 45%, rgba(253,246,238,0) 75%)",
            }}
          />
          <div className="absolute inset-0 p-6 flex flex-col justify-center">
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 400,
                fontSize: 34,
                color: VINHO_ESCURO,
                lineHeight: 1.1,
              }}
            >
              Clientes &amp; Fornecedores
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                style={{
                  display: "inline-block",
                  width: 40,
                  height: 1.5,
                  background: DOURADO,
                }}
              />
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  color: DOURADO,
                  fontSize: 14,
                }}
              >
                Cuide das pessoas que sustentam a sua confeitaria.
              </span>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            {[CalendarDays, Settings2].map((Icon, i) => (
              <button
                key={i}
                className="rounded-full w-9 h-9 flex items-center justify-center backdrop-blur transition hover:bg-white"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: `1px solid ${VINHO}26`,
                  color: VINHO,
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* COLUNA ESQUERDA */}
          <div className="space-y-4">
            {/* CARD CLIENTES */}
            <div
              onClick={() => navigate("/clientes")}
              className="bg-white rounded-xl p-5 cursor-pointer transition hover:shadow-md"
              style={{ border: `1px solid ${VINHO}1A` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: CREME }}
                >
                  <Users size={22} color={VINHO} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18,
                      color: VINHO_ESCURO,
                    }}
                  >
                    Clientes
                  </h3>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Cadastro completo, contatos e familiares de quem encomenda
                    com você.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {clientesRecentes.map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: CREME }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                      style={{ background: VINHO }}
                    >
                      {inicial(c.nome)}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold truncate"
                        style={{ color: VINHO_ESCURO }}
                      >
                        {c.nome}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Cake size={12} color={VINHO} />
                        <span>Última atividade</span>
                      </div>
                    </div>
                  </div>
                ))}
                {Array.from({ length: placeholdersClientes }).map((_, i) => (
                  <div
                    key={`ph-${i}`}
                    className="rounded-xl p-3 h-[60px] border border-dashed"
                    style={{
                      background: `${CREME}80`,
                      borderColor: `${VINHO}26`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ORIGEM DE PEDIDOS */}
            <div
              className="bg-white rounded-xl p-5"
              style={{ border: `1px solid ${VINHO}1A` }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16,
                  color: VINHO_ESCURO,
                }}
                className="mb-3"
              >
                Origem de Pedidos
              </h3>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="h-[180px]">
                  {origemData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={origemData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {origemData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-xs text-muted-foreground"
                      style={{ background: CREME }}
                    >
                      Sem dados
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                    style={{ border: `1px solid ${VINHO}33` }}
                  >
                    <Search size={14} color={VINHO} />
                    <input
                      placeholder="Buscar..."
                      className="bg-transparent text-xs outline-none flex-1"
                    />
                  </div>
                  <div className="space-y-1.5 max-h-[130px] overflow-auto">
                    {origemData.map((o, i) => (
                      <div
                        key={o.name}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: VINHO_ESCURO }}
                      >
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{
                            background: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="truncate">{o.name}</span>
                      </div>
                    ))}
                    {origemData.length === 0 && (
                      <div className="text-xs text-muted-foreground">
                        Sem origens cadastradas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="space-y-4">
            {/* CARD CONTATO */}
            <div
              className="bg-white rounded-xl p-5"
              style={{ border: `1px solid ${VINHO}1A` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: CREME }}
                >
                  <UserRound size={22} color={VINHO} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    color: VINHO_ESCURO,
                  }}
                >
                  Contato
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[Phone, Phone, MessageCircle, User].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-9 h-9 mx-auto rounded-full flex items-center justify-center transition group"
                    style={{ background: CREME, color: VINHO }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = VINHO;
                      (e.currentTarget as HTMLElement).style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = CREME;
                      (e.currentTarget as HTMLElement).style.color = VINHO;
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* CARD FORNECEDORES */}
            <div
              onClick={() => navigate("/fornecedores")}
              className="bg-white rounded-xl p-5 cursor-pointer transition hover:shadow-md"
              style={{ border: `1px solid ${VINHO}1A` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: CREME }}
                >
                  <Truck size={22} color={VINHO} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18,
                      color: VINHO_ESCURO,
                    }}
                  >
                    Fornecedores
                  </h3>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Parcerias de insumos, embalagens e serviços que abastecem o
                    seu ateliê.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {fornecedoresRecentes.map((f: any) => (
                  <div
                    key={f.id}
                    className="rounded-xl p-2 flex flex-col items-center gap-1"
                    style={{ background: CREME }}
                  >
                    <Store size={28} color={VINHO} />
                    <div
                      className="text-[11px] font-semibold text-center truncate w-full"
                      style={{ color: VINHO_ESCURO }}
                      title={f.nome}
                    >
                      {f.nome}
                    </div>
                  </div>
                ))}
                {Array.from({ length: placeholdersFornecedores }).map((_, i) => (
                  <div
                    key={`fph-${i}`}
                    className="rounded-xl p-2 h-[60px] border border-dashed"
                    style={{
                      background: `${CREME}80`,
                      borderColor: `${VINHO}26`,
                    }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3">
                {[Phone, Phone, Mail, MessageCircle].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: CREME, color: VINHO }}
                  >
                    <Icon size={14} />
                  </div>
                ))}
              </div>
            </div>

            {/* ESTOQUE POR FORNECEDOR */}
            <div
              className="bg-white rounded-xl p-5"
              style={{ border: `1px solid ${VINHO}1A` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16,
                    color: VINHO_ESCURO,
                  }}
                >
                  Estoque por Fornecedor
                </h3>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium"
                  style={{
                    background: CREME,
                    border: `1px solid ${VINHO}26`,
                    color: VINHO_ESCURO,
                  }}
                >
                  <Package size={14} color={VINHO} />
                  {formatBRL(estoqueTotal)}
                </div>
              </div>
              <div style={{ height: 140 }}>
                {estoqueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={estoqueChartData}
                      margin={{ top: 18, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="nome"
                        tick={{ fontSize: 10, fill: VINHO_ESCURO }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v: any, _n, p: any) => [
                          `${v} ${p.payload.unidade}`,
                          p.payload.nomeCompleto,
                        ]}
                      />
                      <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
                        {estoqueChartData.map((_: any, i: number) => (
                          <Cell
                            key={i}
                            fill={BAR_COLORS[i % BAR_COLORS.length]}
                          />
                        ))}
                        <LabelList
                          dataKey="quantidade"
                          position="top"
                          style={{ fontSize: 9, fill: VINHO_ESCURO }}
                          formatter={(v: any) => `${v}`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Sem estoque cadastrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB VOLTAR */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-11 h-11 flex items-center justify-center shadow-lg transition hover:scale-105"
        style={{ background: VINHO, color: "#fff" }}
        aria-label="Voltar"
      >
        <ChevronLeft size={20} />
      </button>
    </div>
  );
}
