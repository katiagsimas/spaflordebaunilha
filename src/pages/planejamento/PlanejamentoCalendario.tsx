import { useState, useMemo, useCallback, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Gift, Heart, Star, PartyPopper, Flame, Baby, Ghost, Egg, Sun, GripVertical } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO, differenceInDays, addDays, addWeeks, getMonth, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  heart: Heart, star: Star, "party-popper": PartyPopper, flame: Flame,
  baby: Baby, ghost: Ghost, egg: Egg, gift: Gift, calendar: Calendar, sun: Sun,
};

interface CalendarEvent {
  type: "comemorativa" | "encomenda" | "descanso";
  id: string;
  label: string;
  cor: string;
  icone: string;
  draggable: boolean;
}

export function PlanejamentoCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const { activeGroup } = useGroup();
  const queryClient = useQueryClient();

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

  const datasDoMes = useMemo(() => {
    return datasComem.filter((d: any) => {
      const [mm] = (d.data_referencia || "").split("-");
      return mm === currentMonth;
    });
  }, [datasComem, currentMonth]);

  const getEventsForDay = useCallback((day: Date): CalendarEvent[] => {
    const dayStr = format(day, "MM-dd");
    const events: CalendarEvent[] = [];

    datasComem.forEach((d: any) => {
      if (d.data_referencia === dayStr) {
        events.push({ type: "comemorativa", id: d.id, label: d.nome, cor: d.cor || "#C6A85A", icone: d.icone || "calendar", draggable: false });
      }
    });

    encomendas.forEach((e: any) => {
      if (e.data_entrega && isSameDay(parseISO(e.data_entrega), day)) {
        events.push({ type: "encomenda", id: e.id, label: `📦 ${e.cliente_nome || "Encomenda"}`, cor: "#BFCFB8", icone: "calendar", draggable: true });
      }
    });

    descansos.forEach((d: any) => {
      const inicio = parseISO(d.data_inicio);
      const fim = parseISO(d.data_fim);
      if (day >= inicio && day <= fim) {
        const label = `🌴 ${d.tipo === "ferias" ? "Férias" : d.tipo === "folga" ? "Folga" : "Pessoal"}`;
        // Only show drag handle on start day
        events.push({ type: "descanso", id: d.id, label, cor: "#87CEEB", icone: "sun", draggable: isSameDay(day, inicio) });
      }
    });

    return events;
  }, [datasComem, encomendas, descansos]);

  const handleDragStart = (e: DragEvent, event: CalendarEvent, dayStr: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ ...event, originDay: dayStr }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, dayISO: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(dayISO);
  };

  const handleDragLeave = () => setDragOverDay(null);

  const handleDrop = async (e: DragEvent, targetDay: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    try {
      const payload = JSON.parse(e.dataTransfer.getData("application/json"));
      const newDate = format(targetDay, "yyyy-MM-dd");

      if (payload.type === "encomenda") {
        const { error } = await supabase
          .from("encomendas")
          .update({ data_entrega: newDate })
          .eq("id", payload.id);
        if (error) throw error;
        toast.success("Data de entrega atualizada!");
        queryClient.invalidateQueries({ queryKey: ["planejamento-encomendas"] });
      } else if (payload.type === "descanso") {
        const descanso = descansos.find((d: any) => d.id === payload.id);
        if (descanso) {
          const duration = differenceInDays(parseISO(descanso.data_fim), parseISO(descanso.data_inicio));
          const novaFim = format(addDays(targetDay, duration), "yyyy-MM-dd");
          const { error } = await (supabase.from("planejamento_descanso" as any)
            .update({ data_inicio: newDate, data_fim: novaFim })
            .eq("id", payload.id) as any);
          if (error) throw error;
          toast.success("Descanso reagendado!");
          queryClient.invalidateQueries({ queryKey: ["planejamento-descanso"] });
        }
      }
    } catch {
      toast.error("Erro ao mover evento");
    }
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

      {/* Dica de arrastar */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <GripVertical className="h-3.5 w-3.5" />
        Arraste encomendas e descansos entre dias para reagendar rapidamente.
      </p>

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
              const dayISO = day.toISOString();
              const isDragTarget = dragOverDay === dayISO;
              return (
                <div
                  key={dayISO}
                  onDragOver={(e) => handleDragOver(e, dayISO)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  className={`min-h-[70px] md:min-h-[90px] border rounded-lg p-1 text-xs transition-colors ${
                    isDragTarget
                      ? "border-cda-dourado border-2 bg-cda-dourado/10"
                      : isToday
                      ? "border-cda-dourado bg-cda-dourado/5 ring-1 ring-cda-dourado/30"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`font-semibold mb-0.5 ${isToday ? "text-cda-dourado" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {events.slice(0, 3).map((ev, i) => (
                      <div
                        key={`${ev.id}-${i}`}
                        draggable={ev.draggable}
                        onDragStart={ev.draggable ? (e) => handleDragStart(e, ev, dayISO) : undefined}
                        className={`truncate text-[10px] rounded px-1 py-0.5 ${
                          ev.draggable ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-cda-dourado/50" : ""
                        }`}
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
