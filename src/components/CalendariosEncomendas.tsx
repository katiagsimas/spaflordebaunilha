import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, ChevronLeft, ChevronRight, FileDown, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

export function CalendariosEncomendas({ onNovaEncomenda }: { onNovaEncomenda?: () => void } = {}) {
  const { user } = useAuth();
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
    if (!user) return;
    const channel = supabase
      .channel("calendarios-encomendas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encomendas" },
        () => recarregarTudo()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mesAtual, mesAnterior, mesSeguinte]);

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
    cardClass: string,
    cores: { hoje: string; amanha?: string; comum: string },
    target: "anterior" | "atual" | "seguinte",
  ) => {
    const dataRef = new Date(refMes.ano, refMes.mes, 1);
    const primeiroDia = getDay(startOfMonth(dataRef));
    const diasVazios = Array(primeiroDia).fill(null);
    const diasCalendario = [...diasVazios, ...dados];

    return (
      <Card className={cardClass}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {meses[refMes.mes]} {refMes.ano}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navegar("prev", target)}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navegar("next", target)}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {dia}
              </div>
            ))}
            {diasCalendario.map((d, index) => {
              if (!d) return <div key={`empty-${index}`} className="aspect-square" />;
              const isSelected = isSameDay(d.dia, diaSelecionado);
              const temEncomendas = d.quantidade > 0;
              let bg = "bg-background";
              let txt = "text-foreground";
              if (d.isHoje && temEncomendas) {
                bg = "bg-red-200";
                txt = "text-red-700";
              } else if (d.isAmanha && temEncomendas && cores.amanha) {
                bg = cores.amanha;
                txt = "text-orange-700";
              } else if (temEncomendas) {
                bg = cores.comum;
                txt = cores.hoje;
              }
              const ring = isSelected ? "ring-2 ring-primary" : "";
              return (
                <button
                  key={index}
                  onClick={() => selecionarDia(d)}
                  className={`aspect-square flex items-center justify-center rounded text-[10px] hover:scale-110 transition-transform ${bg} ${txt} ${ring}`}
                >
                  <div className="flex flex-col items-center">
                    <span>{format(d.dia, "d")}</span>
                    {temEncomendas && <span className="text-[8px] font-bold">{d.quantidade}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Calendários de Encomendas</h2>
        <p className="text-muted-foreground">Visualize suas encomendas em 3 meses consecutivos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {renderCalendario(
          dadosAnterior,
          mesAnterior,
          "border-cda-coral/30 bg-cda-coral/10 dark:bg-cda-coral/5",
          { hoje: "text-blue-700", comum: "bg-blue-200" },
          "anterior",
        )}
        {renderCalendario(
          dadosAtual,
          mesAtual,
          "border-cda-dourado/30 bg-cda-vinho/10 dark:bg-cda-vinho/5",
          { hoje: "text-green-700", amanha: "bg-orange-200", comum: "bg-green-200" },
          "atual",
        )}
        {renderCalendario(
          dadosSeguinte,
          mesSeguinte,
          "border-cda-pink/30 bg-cda-pink/10 dark:bg-cda-pink/5",
          { hoje: "text-purple-700", comum: "bg-purple-200" },
          "seguinte",
        )}
      </div>

      <Card className="border-cda-dourado/30 bg-cda-creme/40 shadow-soft overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-cda-vinho">
              <CalendarDays className="h-5 w-5 text-cda-vinho" />
              <span className="font-serif text-xl">
                Encomendas – {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
              </span>
              {isToday(diaSelecionado) && (
                <Badge className="bg-cda-dourado text-cda-preto hover:bg-cda-dourado">HOJE</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {encomendasDia.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-cda-vinho/20 text-cda-vinho hover:bg-cda-vinho/5"
                    onClick={() => {
                      const linhas = [
                        ["Cliente", "Horário", "Valor", "Status"],
                        ...encomendasDia.map((e) => [
                          e.cliente,
                          e.hora_entrega || "",
                          e.valor.toFixed(2).replace(".", ","),
                          e.status,
                        ]),
                      ];
                      const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
                      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `encomendas-${format(diaSelecionado, "yyyy-MM-dd")}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar para Excel
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={buscaDia}
                      onChange={(e) => setBuscaDia(e.target.value)}
                      placeholder="Buscar por nome, cliente, evento..."
                      className="pl-9 h-9 w-64 bg-background"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {encomendasDia.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 md:flex-row md:items-center md:justify-center md:gap-10">
              <img
                src={calendarioMacaron}
                alt=""
                aria-hidden="true"
                className="h-32 w-auto object-contain shrink-0 select-none pointer-events-none"
              />
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <p className="text-lg font-semibold text-cda-vinho">Nenhuma encomenda para este dia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você ainda não possui encomendas cadastradas para {isToday(diaSelecionado) ? "hoje" : "esta data"}.
                </p>
                {onNovaEncomenda && (
                  <Button
                    onClick={onNovaEncomenda}
                    className="mt-4 rounded-lg bg-[#3D0F1C] text-white hover:bg-[#3D0F1C]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Encomenda
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {encomendasDia
                .filter((e) =>
                  buscaDia.trim() === ""
                    ? true
                    : e.cliente.toLowerCase().includes(buscaDia.toLowerCase()),
                )
                .map((encomenda) => (
                  <Card key={encomenda.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{encomenda.cliente}</p>
                            <Badge variant="outline" className="text-xs">
                              {encomenda.hora_entrega || "Sem horário"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            R$ {encomenda.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/encomendas?id=${encomenda.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
