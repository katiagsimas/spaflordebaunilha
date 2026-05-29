import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight, FileDown, Plus, Search, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";

import { useNavigate } from "react-router-dom";
import calendarioMacaron from "@/assets/calendario-macaron.png";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Encomenda {
  id: string;
  cliente: string;
  data_entrega: string;
  hora_entrega: string;
  valor: number;
  status: string;
}

interface DadosDia {
  dia: Date;
  encomendas: Encomenda[];
  quantidade: number;
  isHoje: boolean;
  isAmanha: boolean;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const statusBadge: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  em_producao: "bg-purple-100 text-purple-800 border-purple-200",
  pronto: "bg-emerald-100 text-emerald-800 border-emerald-200",
  entregue: "bg-cda-vinho/10 text-cda-vinho border-cda-vinho/20",
  cancelado: "bg-rose-100 text-rose-800 border-rose-200",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

async function carregarMes(userId: string, ano: number, mes: number): Promise<DadosDia[]> {
  const dataRef = new Date(ano, mes, 1);
  const inicio = startOfMonth(dataRef);
  const fim = endOfMonth(dataRef);
  const inicioStr = format(inicio, "yyyy-MM-dd");
  const fimStr = format(fim, "yyyy-MM-dd");

  const { data: encomendas } = await supabase
    .from("encomendas")
    .select("id, data_entrega, hora_entrega, valor, status, cliente")
    .eq("usuario_id", userId)
    .gte("data_entrega", inicioStr)
    .lte("data_entrega", fimStr)
    .neq("status", "cancelado")
    .order("data_entrega", { ascending: true });

  const dias = eachDayOfInterval({ start: inicio, end: fim });
  return dias.map((dia) => {
    const encomendasDia =
      encomendas
        ?.filter((enc) => isSameDay(new Date(enc.data_entrega!), dia))
        .map((enc) => ({
          id: enc.id,
          cliente: enc.cliente || "Cliente",
          data_entrega: enc.data_entrega || "",
          hora_entrega: enc.hora_entrega || "",
          valor: enc.valor || 0,
          status: enc.status || "pendente",
        })) || [];
    return {
      dia,
      encomendas: encomendasDia,
      quantidade: encomendasDia.length,
      isHoje: isToday(dia),
      isAmanha: isTomorrow(dia),
    };
  });
}

export function CalendariosEncomendas({
  onNovaEncomenda,
  mesSelecionado,
  anoSelecionado,
}: {
  onNovaEncomenda?: () => void;
  /** Mês 0-11 — quando informado, o calendário central acompanha o filtro de período da página */
  mesSelecionado?: number;
  anoSelecionado?: number;
} = {}) {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();

  const navigate = useNavigate();

  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState({ mes: hoje.getMonth(), ano: hoje.getFullYear() });
  const [mesAnterior, setMesAnterior] = useState(() => {
    const m = hoje.getMonth() - 1;
    return m < 0 ? { mes: 11, ano: hoje.getFullYear() - 1 } : { mes: m, ano: hoje.getFullYear() };
  });
  const [mesSeguinte, setMesSeguinte] = useState(() => {
    const m = hoje.getMonth() + 1;
    return m > 11 ? { mes: 0, ano: hoje.getFullYear() + 1 } : { mes: m, ano: hoje.getFullYear() };
  });

  // Sincroniza com o filtro de período da página (Total/Pendentes/Confirmadas/Entregues/Canceladas)
  useEffect(() => {
    if (mesSelecionado == null || anoSelecionado == null) return;
    setMesAtual({ mes: mesSelecionado, ano: anoSelecionado });
    const prev = mesSelecionado === 0
      ? { mes: 11, ano: anoSelecionado - 1 }
      : { mes: mesSelecionado - 1, ano: anoSelecionado };
    const next = mesSelecionado === 11
      ? { mes: 0, ano: anoSelecionado + 1 }
      : { mes: mesSelecionado + 1, ano: anoSelecionado };
    setMesAnterior(prev);
    setMesSeguinte(next);
    // Seleciona o dia 1 do mês escolhido (ou hoje se for o mês atual)
    const novaData =
      mesSelecionado === hoje.getMonth() && anoSelecionado === hoje.getFullYear()
        ? hoje
        : new Date(anoSelecionado, mesSelecionado, 1);
    setDiaSelecionado(novaData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionado, anoSelecionado]);

  const [dadosAtual, setDadosAtual] = useState<DadosDia[]>([]);
  const [dadosAnterior, setDadosAnterior] = useState<DadosDia[]>([]);
  const [dadosSeguinte, setDadosSeguinte] = useState<DadosDia[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(hoje);
  const [encomendasDia, setEncomendasDia] = useState<Encomenda[]>([]);
  const [buscaDia, setBuscaDia] = useState("");

  const recarregarTudo = async () => {
    if (!user) return;
    const [a, b, c] = await Promise.all([
      carregarMes(user.id, mesAnterior.ano, mesAnterior.mes),
      carregarMes(user.id, mesAtual.ano, mesAtual.mes),
      carregarMes(user.id, mesSeguinte.ano, mesSeguinte.mes),
    ]);
    setDadosAnterior(a);
    setDadosAtual(b);
    setDadosSeguinte(c);
    const todos = [...a, ...b, ...c];
    const sel = todos.find((d) => isSameDay(d.dia, diaSelecionado));
    if (sel) setEncomendasDia(sel.encomendas);
    else {
      const dadosHoje = todos.find((d) => isToday(d.dia));
      if (dadosHoje) setEncomendasDia(dadosHoje.encomendas);
    }
  };

  useEffect(() => {
    recarregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mesAtual, mesAnterior, mesSeguinte]);

  useEffect(() => {
    if (!user || !activeGroupId) return;
    const channel = supabase
      .channel("calendarios-encomendas-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "encomendas",
          filter: `owner_group_id=eq.${activeGroupId}`,
        },
        () => recarregarTudo()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeGroupId, mesAtual, mesAnterior, mesSeguinte]);


  function selecionarDia(dados: DadosDia) {
    setDiaSelecionado(dados.dia);
    setEncomendasDia(dados.encomendas);
  }

  function navegar(direcao: "prev" | "next", calendario: "anterior" | "atual" | "seguinte") {
    const move = (m: { mes: number; ano: number }) =>
      direcao === "prev"
        ? m.mes === 0
          ? { mes: 11, ano: m.ano - 1 }
          : { mes: m.mes - 1, ano: m.ano }
        : m.mes === 11
        ? { mes: 0, ano: m.ano + 1 }
        : { mes: m.mes + 1, ano: m.ano };

    if (calendario === "anterior") setMesAnterior(move(mesAnterior));
    else if (calendario === "atual") setMesAtual(move(mesAtual));
    else setMesSeguinte(move(mesSeguinte));
  }

  const renderCalendario = (
    dados: DadosDia[],
    refMes: { mes: number; ano: number },
    target: "anterior" | "atual" | "seguinte",
    destaque = false,
  ) => {
    const dataRef = new Date(refMes.ano, refMes.mes, 1);
    const primeiroDia = getDay(startOfMonth(dataRef));
    const diasVazios = Array(primeiroDia).fill(null);
    const diasCalendario = [...diasVazios, ...dados];

    return (
      <Card
        className={cn(
          "border bg-cda-branco shadow-[0_8px_24px_-18px_rgba(91,26,43,0.25)]",
          destaque
            ? "border-cda-dourado/50 ring-1 ring-cda-dourado/30"
            : "border-cda-dourado/20",
        )}
      >
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg tracking-tight text-cda-vinho-escuro">
              {meses[refMes.mes]}{" "}
              <span className="font-body text-sm font-normal italic text-cda-vinho/70">
                {refMes.ano}
              </span>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-cda-vinho hover:bg-cda-creme hover:text-cda-vinho-escuro"
                onClick={() => navegar("prev", target)}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-cda-vinho hover:bg-cda-creme hover:text-cda-vinho-escuro"
                onClick={() => navegar("next", target)}
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="grid grid-cols-7 gap-1">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
              <div
                key={i}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-cda-vinho/55"
              >
                {dia}
              </div>
            ))}
            {diasCalendario.map((d, index) => {
              if (!d) return <div key={`empty-${index}`} className="aspect-square" />;
              const isSelected = isSameDay(d.dia, diaSelecionado);
              const temEncomendas = d.quantidade > 0;
              const ehHoje = d.isHoje;

              return (
                <button
                  key={index}
                  onClick={() => selecionarDia(d)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] font-medium transition",
                    "hover:bg-cda-creme/80",
                    ehHoje && "bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro",
                    !ehHoje && isSelected && "bg-cda-dourado/20 text-cda-vinho-escuro ring-1 ring-cda-dourado",
                    !ehHoje && !isSelected && "text-cda-vinho-escuro",
                  )}
                  aria-label={`Dia ${format(d.dia, "d")}${temEncomendas ? `, ${d.quantidade} encomenda(s)` : ""}`}
                >
                  <span className={cn("leading-none", ehHoje && "font-bold")}>
                    {format(d.dia, "d")}
                  </span>
                  {temEncomendas && (
                    <span
                      className={cn(
                        "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                        ehHoje ? "bg-cda-dourado" : "bg-cda-dourado",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const encomendasFiltradas = encomendasDia.filter((e) =>
    buscaDia.trim() === "" ? true : e.cliente.toLowerCase().includes(buscaDia.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl tracking-tight text-cda-vinho-escuro">
          Calendários de Encomendas
        </h2>
        <p className="mt-1 font-body text-sm italic text-cda-vinho/70">
          Visualize suas encomendas em 3 meses consecutivos
        </p>
      </div>



      <div className="grid gap-4 md:grid-cols-3">
        {renderCalendario(dadosAnterior, mesAnterior, "anterior")}
        {renderCalendario(dadosAtual, mesAtual, "atual", true)}
        {renderCalendario(dadosSeguinte, mesSeguinte, "seguinte")}
      </div>
    </div>
  );
}
