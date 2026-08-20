import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useResumoMesAnterior, useHistoricoMeuSalario } from "@/hooks/useMeuSalario";
import { CenarioResultado } from "@/components/meu-salario/CenarioResultado";
import { FraseRendaDoce } from "@/components/meu-salario/FraseRendaDoce";
import { exportarMeuSalarioPDF } from "@/utils/exportarMeuSalarioPDF";
import { formatBRL } from "@/lib/formatUtils";
import {
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip,
} from "recharts";

const PLAYFAIR = "'Playfair Display', serif";

const COR_DOURADO = "#C98A75";
const COR_VINHO = "#3D2F28";
const COR_VINHO_ESCURO = "#2A1F1A";

const DISTRIB_CORES = ["#2A1F1A", "#3D2F28", "#8B4513", "#C98A75", "#D2B48C"];
const DISTRIB_LABELS = ["Ingredientes", "Mão de Obra", "Embalagens", "Logística", "Impostos"];

export function VisaoGeral() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mes0Atual = hoje.getMonth();

  const anoPadrao = mes0Atual === 0 ? anoAtual - 1 : anoAtual;
  const mes0Padrao = mes0Atual === 0 ? 11 : mes0Atual - 1;

  const [ano, setAno] = useState<number>(anoPadrao);
  const [mes0, setMes0] = useState<number>(mes0Padrao);

  const { data: resumo, isLoading, error } = useResumoMesAnterior({ ano, mes0 });
  const { data: historico } = useHistoricoMeuSalario(6);

  const podeAvancar = !(ano === anoAtual && mes0 >= mes0Atual);

  const irAnterior = () => {
    if (mes0 === 0) { setMes0(11); setAno(ano - 1); }
    else setMes0(mes0 - 1);
  };
  const irProximo = () => {
    if (!podeAvancar) return;
    if (mes0 === 11) { setMes0(0); setAno(ano + 1); }
    else setMes0(mes0 + 1);
  };

  // Dados gráfico de área Receita x Custo (últimos 6 meses)
  const dadosArea = useMemo(() => {
    if (!historico || historico.length === 0) return [];
    return historico.map((h) => ({
      mes: h.rotuloMes.split(" ")[0].slice(0, 3),
      Receita: Math.round(h.faturamento),
      Custo: Math.round(h.custos),
    }));
  }, [historico]);

  // Distribuição ilustrativa (não há hook de breakdown de custos por categoria)
  const dadosDistribuicao = useMemo(() => {
    const pcts = [7, 1, 2, 2, 1]; // ilustrativo
    return DISTRIB_LABELS.map((label, i) => ({
      name: label,
      value: pcts[i],
      cor: DISTRIB_CORES[i],
    }));
  }, []);

  // Performance: últimas 4 retiradas mensais
  const dadosPerformance = useMemo(() => {
    if (!historico) return [];
    return historico.slice(-4).map((h, i) => ({
      mes: h.rotuloMes.split(" ")[0].slice(0, 3),
      valor: Math.round(h.retiradas || h.proLaboreSaudavel || 0),
      cor: DISTRIB_CORES[i] ?? COR_DOURADO,
    }));
  }, [historico]);

  const lucroBruto = resumo ? resumo.faturamento - resumo.custos : 0;

  return (
    <div className="space-y-5">
      {/* Seletor de mês */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[#2A1F1A]/50">Mês de referência</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={irAnterior}
            aria-label="Mês anterior"
            className="w-9 h-9 rounded-full border border-[#3D2F28]/20 text-[#3D2F28] flex items-center justify-center hover:bg-[#FBF6EE] transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            className="text-base text-[#2A1F1A] capitalize text-center min-w-[160px]"
            style={{ fontFamily: PLAYFAIR }}
          >
            {resumo?.rotuloMes ?? "—"}
          </span>
          <button
            type="button"
            onClick={irProximo}
            disabled={!podeAvancar}
            aria-label="Próximo mês"
            className="w-9 h-9 rounded-full border border-[#3D2F28]/20 text-[#3D2F28] flex items-center justify-center hover:bg-[#FBF6EE] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-[#3D2F28] py-10 text-center">Preparando seu resumo...</div>
      )}

      {error && (
        <div className="rounded-2xl border border-[#C98A75] bg-[#C98A75]/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-[#C98A75] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#2A1F1A]">
            Ainda não há informações financeiras suficientes neste mês
          </h3>
          <p className="text-sm text-[#2A1F1A]/80 mt-2 max-w-xl mx-auto">
            Para calcular seu salário, precisamos de lançamentos em Contas a Receber, Contas a Pagar e Retiradas referentes ao período selecionado. Cadastre suas movimentações financeiras ou escolha outro mês de referência para visualizar o resumo.
          </p>
        </div>
      )}


      {resumo && !isLoading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* COLUNA ESQUERDA — Receita e Custo */}
            <div className="bg-white border border-[#3D2F28]/10 rounded-xl p-5 flex flex-col">
              <h3 className="text-[18px] text-[#2A1F1A] mb-4" style={{ fontFamily: PLAYFAIR }}>
                Receita e Custo
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[#2A1F1A]/55">Receita Total</p>
                  <p className="text-[22px] font-bold text-[#2A1F1A] leading-tight">
                    {formatBRL(resumo.faturamento)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#2A1F1A]/55">Lucro Bruto</p>
                  <p className="text-base font-bold text-[#2A1F1A] leading-tight">
                    {formatBRL(lucroBruto)}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dadosArea} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COR_DOURADO} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COR_DOURADO} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="grCus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COR_VINHO} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={COR_VINHO} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid rgba(91,26,43,0.2)",
                        borderRadius: 8,
                        fontFamily: "Inter",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatBRL(v)}
                    />
                    <Area
                      type="monotone"
                      dataKey="Receita"
                      stroke={COR_DOURADO}
                      strokeWidth={2}
                      fill="url(#grRec)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Custo"
                      stroke={COR_VINHO}
                      strokeWidth={2}
                      fill="url(#grCus)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-end mt-2">
                <div className="text-right">
                  <p className="text-xs text-[#2A1F1A]/55">Custo Total</p>
                  <p className="text-[22px] font-bold text-[#2A1F1A] leading-tight">
                    {formatBRL(resumo.custos)}
                  </p>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="space-y-4">
              {/* Distribuição de Custos */}
              <div className="bg-white border border-[#3D2F28]/10 rounded-xl p-5">
                <h3 className="text-base text-[#2A1F1A] mb-3" style={{ fontFamily: PLAYFAIR }}>
                  Distribuição de Custos
                </h3>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosDistribuicao}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {dadosDistribuicao.map((d, i) => (
                            <Cell key={i} fill={d.cor} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-1.5">
                    {dadosDistribuicao.map((d) => (
                      <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-[#2A1F1A]">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: d.cor }}
                          />
                          {d.name}
                        </div>
                        <span className="text-[#2A1F1A]/50">{d.value}% Ilustrativo</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Retiradas Disponíveis */}
                <div className="bg-white border border-[#3D2F28]/10 rounded-xl p-4">
                  <h3 className="text-[15px] text-[#2A1F1A] mb-3" style={{ fontFamily: PLAYFAIR }}>
                    Retiradas Disponíveis
                  </h3>
                  <p className="text-xs text-[#2A1F1A]/55">Disponível para Retirada</p>
                  <p className="text-[26px] font-bold text-[#2A1F1A] leading-tight mt-1">
                    {formatBRL(Math.max(0, resumo.saldoRestante))}
                  </p>
                </div>

                {/* Performance do Mês */}
                <div className="bg-white border border-[#3D2F28]/10 rounded-xl p-4">
                  <h3 className="text-[15px] text-[#2A1F1A] mb-2" style={{ fontFamily: PLAYFAIR }}>
                    Performance do Mês
                  </h3>
                  <div className="h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPerformance} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid rgba(91,26,43,0.2)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v: number) => formatBRL(v)}
                          cursor={{ fill: "rgba(91,26,43,0.05)" }}
                        />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {dadosPerformance.map((d, i) => (
                            <Cell key={i} fill={d.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CenarioResultado resumo={resumo} />

          <div className="flex justify-end">
            <Button
              onClick={() => exportarMeuSalarioPDF(resumo)}
              variant="outline"
              className="border-[#C98A75] text-[#3D2F28] hover:bg-[#FBF6EE]"
            >
              <Download className="h-4 w-4 mr-2" />
              Salvar meu resumo
            </Button>
          </div>
        </>
      )}

      <FraseRendaDoce />
    </div>
  );
}
