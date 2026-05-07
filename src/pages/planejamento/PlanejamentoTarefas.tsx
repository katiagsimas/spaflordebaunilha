import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Circle, Clock, Trash2, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const areaLabels: Record<string, string> = {
  financeiro: "💰 Financeiro",
  vendas: "📈 Vendas",
  marketing: "📣 Marketing",
  producao: "🍰 Produção",
  atendimento: "🤝 Atendimento",
  pessoal: "🧘 Pessoal",
};

const prioridadeColors: Record<string, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baixa: "bg-green-100 text-green-700 border-green-200",
};

const statusIcons: Record<string, React.ElementType> = {
  pendente: Circle,
  em_andamento: Clock,
  concluida: CheckCircle2,
};

export function PlanejamentoTarefas() {
  const { activeGroup } = useGroup();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroArea, setFiltroArea] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    area: "producao" as string,
    prioridade: "media" as string,
    prazo: "",
  });

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ["planejamento-tarefas", activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup?.id) return [];
      const { data } = await (supabase
        .from("planejamento_tarefas" as any)
        .select("*")
        .eq("owner_group_id", activeGroup.id)
        .order("created_at", { ascending: false }) as any);
      return (data || []) as any[];
    },
    enabled: !!activeGroup?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("planejamento_tarefas" as any).insert({
        owner_group_id: activeGroup?.id,
        user_id: user?.id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        area: form.area,
        prioridade: form.prioridade,
        prazo: form.prazo || null,
      }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planejamento-tarefas"] });
      toast.success("Tarefa criada!");
      setDialogOpen(false);
      setForm({ titulo: "", descricao: "", area: "producao", prioridade: "media", prazo: "" });
    },
    onError: () => toast.error("Erro ao criar tarefa"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "concluida") updates.data_conclusao = format(new Date(), "yyyy-MM-dd");
      const { error } = await (supabase.from("planejamento_tarefas" as any).update(updates).eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planejamento-tarefas"] });
      toast.success("Status atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("planejamento_tarefas" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planejamento-tarefas"] });
      toast.success("Tarefa removida!");
    },
  });

  const nextStatus = (current: string) => {
    if (current === "pendente") return "em_andamento";
    if (current === "em_andamento") return "concluida";
    return "pendente";
  };

  const filtered = tarefas.filter((t: any) => {
    if (filtroArea !== "todas" && t.area !== filtroArea) return false;
    if (filtroStatus !== "todos" && t.status !== filtroStatus) return false;
    return true;
  });

  const grouped = Object.entries(areaLabels).reduce((acc, [key, label]) => {
    const items = filtered.filter((t: any) => t.area === key);
    if (items.length > 0) acc.push({ area: key, label, items });
    return acc;
  }, [] as { area: string; label: string; items: any[] }[]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Select value={filtroArea} onValueChange={setFiltroArea}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as áreas</SelectItem>
              {Object.entries(areaLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cda-dourado hover:bg-cda-dourado/90 text-white">
              <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Título da tarefa" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              <Textarea placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(areaLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
              <Button className="w-full bg-cda-dourado hover:bg-cda-dourado/90 text-white" disabled={!form.titulo} onClick={() => createMutation.mutate()}>
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarefas por área */}
      {grouped.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Nenhuma tarefa encontrada. Crie sua primeira tarefa para começar a organizar seu planejamento!</p>
          </CardContent>
        </Card>
      )}

      {grouped.map(({ area, label, items }) => (
        <Card key={area}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((t: any) => {
              const StatusIcon = statusIcons[t.status] || Circle;
              return (
                <div key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${t.status === "concluida" ? "opacity-60 bg-muted/30" : "hover:bg-muted/20"}`}>
                  <button
                    className="mt-0.5 flex-shrink-0"
                    onClick={() => updateStatusMutation.mutate({ id: t.id, status: nextStatus(t.status) })}
                    title="Alterar status"
                  >
                    <StatusIcon className={`h-5 w-5 ${t.status === "concluida" ? "text-green-500" : t.status === "em_andamento" ? "text-cda-dourado" : "text-muted-foreground"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${t.status === "concluida" ? "line-through" : ""}`}>{t.titulo}</div>
                    {t.descricao && <p className="text-sm text-muted-foreground mt-0.5">{t.descricao}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={`text-xs ${prioridadeColors[t.prioridade] || ""}`}>
                        {t.prioridade === "alta" ? "Alta" : t.prioridade === "media" ? "Média" : "Baixa"}
                      </Badge>
                      {t.prazo && (
                        <span className="text-xs text-muted-foreground">
                          📅 {format(new Date(t.prazo + "T12:00:00"), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteMutation.mutate(t.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
