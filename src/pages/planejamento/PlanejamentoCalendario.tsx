import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Gift, Heart, Star, PartyPopper, Flame, Baby, Ghost, Egg, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";


const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  star: Star,
  "party-popper": PartyPopper,
  flame: Flame,
  baby: Baby,
  ghost: Ghost,
  egg: Egg,
  gift: Gift,
  calendar: Calendar,
  sun: Sun,
};

export function PlanejamentoCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { activeGroup } = useGroup();

  const { data: datasComem = [] } = useQuery({
    queryKey: ["planejamento-datas", activeGroup?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from("planejamento_datas_comemorativas" as any)
        .select("*")
        .eq("ativo", true) as any);
      return (data || []) as any[];
    },
  });

  const { data: descansos = [] } = useQuery({
    queryKey: ["planejamento-descanso", activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup?.id) return [];
      const { data } = await (supabase
        .from("planejamento_descanso" as any)
        .select("*")
        .eq("owner_group_id", activeGroup.id) as any);
      return (data || []) as any[];
    },
    enabled: !!activeGroup?.id,
  });

  const { data: encomendas = [] } = useQuery({
    queryKey: ["planejamento-encomendas", activeGroup?.id, format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      const { data } = await supabase
        .from("encomendas")
        .select("id, data_entrega, cliente_nome, status")
        .gte("data_entrega", start)
        .lte("data_entrega", end);
      return data || [];
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const currentMonth = format(currentDate, "MM");
  const currentYear = format(currentDate, "yyyy");

  const datasDoMes = useMemo(() => {
    return datasComem.filter((d: any) => {
      const [mm] = (d.data_referencia || "").split("-");
      return mm === currentMonth;
    });
  }, [datasComem, currentMonth]);

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, "MM-dd");
    const events: { type: string; label: string; cor: string; icone: string }[] = [];

    datasComem.forEach((d: any) => {
      if (d.data_referencia === dayStr) {
        events.push({ type: "comemorativa", label: d.nome, cor: d.cor || "#C6A85A", icone: d.icone || "calendar" });
      }
    });

    encomendas.forEach((e: any) => {
      if (e.data_entrega && isSameDay(parseISO(e.data_entrega), day)) {
        events.push({ type: "encomenda", label: `📦 ${e.cliente_nome || "Encomenda"}`, cor: "#BFCFB8", icone: "calendar" });
      }
    });

    descansos.forEach((d: any) => {
      const inicio = parseISO(d.data_inicio);
      const fim = parseISO(d.data_fim);
      if (day >= inicio && day <= fim) {
        events.push({ type: "descanso", label: `🌴 ${d.tipo === "ferias" ? "Férias" : d.tipo === "folga" ? "Folga" : "Pessoal"}`, cor: "#87CEEB", icone: "sun" });
      }
    });

    return events;
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-6">
      {/* Datas Comemorativas do Mês */}
      {datasDoMes.length > 0 && (
        <Card className="border-cda-dourado/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-cda-dourado" />
              Datas Comemorativas — {format(currentDate, "MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {datasDoMes.map((d: any) => {
                const IconComp = iconMap[d.icone] || Calendar;
                return (
                  <Badge key={d.id} variant="outline" className="flex items-center gap-1.5 py-1 px-3" style={{ borderColor: d.cor, color: d.cor }}>
                    <IconComp className="h-3.5 w-3.5" />
                    {d.nome} — {d.data_referencia?.split("-")[1]}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendário */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const events = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[70px] md:min-h-[90px] border rounded-lg p-1 text-xs transition-colors ${
                    isToday ? "border-cda-dourado bg-cda-dourado/5 ring-1 ring-cda-dourado/30" : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`font-semibold mb-0.5 ${isToday ? "text-cda-dourado" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {events.slice(0, 3).map((ev, i) => (
                      <div
                        key={i}
                        className="truncate text-[10px] rounded px-1 py-0.5"
                        style={{ backgroundColor: ev.cor + "20", color: ev.cor }}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{events.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
