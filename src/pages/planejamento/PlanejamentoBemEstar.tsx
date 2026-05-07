import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Sun, Coffee, Palmtree, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ferias: { label: "Férias", icon: Palmtree, color: "text-emerald-600" },
  folga: { label: "Folga", icon: Coffee, color: "text-blue-500" },
  pessoal: { label: "Pessoal", icon: Sun, color: "text-amber-500" },
};

export function PlanejamentoBemEstar() {
  const { activeGroup } = useGroup();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ data_inicio: "", data_fim: "", tipo: "folga", observacao: "", recorrente: false, recorrencia_tipo: "anual" });

  const { data: descansos = [] } = useQuery({
    queryKey: ["planejamento-descanso", activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup?.id) return [];
      const { data } = await (supabase
        .from("planejamento_descanso" as any)
        .select("*")
        .eq("owner_group_id", activeGroup.id)
        .order("data_inicio", { ascending: true }) as any);
      return (data || []) as any[];
    },
    enabled: !!activeGroup?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("planejamento_descanso" as any).insert({
        owner_group_id: activeGroup?.id,
        user_id: user?.id,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        tipo: form.tipo,
        observacao: form.observacao || null,
      }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planejamento-descanso"] });
      toast.success("Descanso registrado!");
      setDialogOpen(false);
      setForm({ data_inicio: "", data_fim: "", tipo: "folga", observacao: "" });
    },
    onError: () => toast.error("Erro ao registrar descanso"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("planejamento_descanso" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planejamento-descanso"] });
      toast.success("Removido!");
    },
  });

  // Calcular indicadores do mês atual
  const stats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const allDays = eachDayOfInterval({ start, end });
    const workDays = allDays.filter((d) => !isWeekend(d));
    
    let diasDescanso = 0;
    descansos.forEach((d: any) => {
      const dStart = parseISO(d.data_inicio);
      const dEnd = parseISO(d.data_fim);
      const days = eachDayOfInterval({ start: dStart > start ? dStart : start, end: dEnd < end ? dEnd : end });
      days.forEach((day) => {
        if (isSameMonth(day, now)) diasDescanso++;
      });
    });

    // Check last rest
    const today = new Date();
    let lastRestEnd: Date | null = null;
    descansos.forEach((d: any) => {
      const dEnd = parseISO(d.data_fim);
      if (dEnd <= today && (!lastRestEnd || dEnd > lastRestEnd)) lastRestEnd = dEnd;
    });
    const diasSemDescanso = lastRestEnd ? differenceInDays(today, lastRestEnd) : null;

    return {
      diasNoMes: allDays.length,
      diasUteis: workDays.length,
      diasDescanso,
      diasTrabalhados: workDays.length - diasDescanso,
      diasSemDescanso,
    };
  }, [descansos]);

  const proximos = descansos.filter((d: any) => parseISO(d.data_fim) >= new Date());
  const passados = descansos.filter((d: any) => parseISO(d.data_fim) < new Date());

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-cda-dourado">{stats.diasTrabalhados}</div>
            <div className="text-xs text-muted-foreground mt-1">Dias trabalhados</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-emerald-600">{stats.diasDescanso}</div>
            <div className="text-xs text-muted-foreground mt-1">Dias de descanso</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-blue-500">{stats.diasUteis}</div>
            <div className="text-xs text-muted-foreground mt-1">Dias úteis no mês</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-foreground">{stats.diasNoMes}</div>
            <div className="text-xs text-muted-foreground mt-1">Total de dias</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta gentil */}
      {stats.diasSemDescanso !== null && stats.diasSemDescanso > 14 && (
        <Card className="border-cda-dourado/50 bg-cda-dourado/5">
          <CardContent className="flex items-start gap-3 pt-4 pb-3">
            <AlertTriangle className="h-5 w-5 text-cda-dourado flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Você está há {stats.diasSemDescanso} dias sem descanso registrado
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Lembre-se: descansar é essencial para manter a qualidade do seu trabalho e a sua saúde. 💛
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão + Lista */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Meus Descansos</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cda-dourado hover:bg-cda-dourado/90 text-white">
              <Plus className="h-4 w-4 mr-1" /> Registrar Descanso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Período de Descanso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias">🌴 Férias</SelectItem>
                  <SelectItem value="folga">☕ Folga</SelectItem>
                  <SelectItem value="pessoal">☀️ Pessoal</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Início</label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fim</label>
                  <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                </div>
              </div>
              <Textarea placeholder="Observação (opcional)" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
              <Button
                className="w-full bg-cda-dourado hover:bg-cda-dourado/90 text-white"
                disabled={!form.data_inicio || !form.data_fim}
                onClick={() => createMutation.mutate()}
              >
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Próximos */}
      {proximos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📅 Próximos / Em Andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximos.map((d: any) => {
              const info = tipoLabels[d.tipo] || tipoLabels.pessoal;
              const Icon = info.icon;
              const dias = differenceInDays(parseISO(d.data_fim), parseISO(d.data_inicio)) + 1;
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20">
                  <Icon className={`h-5 w-5 ${info.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="font-medium">{info.label} — {dias} dia{dias > 1 ? "s" : ""}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(d.data_inicio), "dd/MM/yyyy")} a {format(parseISO(d.data_fim), "dd/MM/yyyy")}
                    </div>
                    {d.observacao && <p className="text-xs text-muted-foreground mt-0.5">{d.observacao}</p>}
                  </div>
                  <button onClick={() => deleteMutation.mutate(d.id)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {passados.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {passados.slice(0, 10).map((d: any) => {
              const info = tipoLabels[d.tipo] || tipoLabels.pessoal;
              const dias = differenceInDays(parseISO(d.data_fim), parseISO(d.data_inicio)) + 1;
              return (
                <div key={d.id} className="flex items-center gap-3 p-2 text-sm text-muted-foreground">
                  <span>{info.label}</span>
                  <span>—</span>
                  <span>{format(parseISO(d.data_inicio), "dd/MM")} a {format(parseISO(d.data_fim), "dd/MM/yyyy")}</span>
                  <Badge variant="outline" className="text-xs">{dias}d</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {descansos.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Sun className="h-12 w-12 text-cda-dourado mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum descanso registrado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Registre suas folgas e férias para acompanhar seu bem-estar!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
