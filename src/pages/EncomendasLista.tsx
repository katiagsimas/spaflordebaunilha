import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useEncomendas } from "@/hooks/useEncomendas";
import { EncomendaStatusCard } from "@/components/encomendas/EncomendaStatusCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { parseISOToDate } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_MAP: Record<
  string,
  { label: string; statusKey: string | null; Icon: any; bg: string; color: string }
> = {
  total: { label: "Total", statusKey: null, Icon: ClipboardList, bg: "bg-[#3D2F28]/10", color: "text-[#3D2F28]" },
  pendentes: { label: "Pendentes", statusKey: "pendente", Icon: Clock, bg: "bg-[#C98A75]/15", color: "text-[#C98A75]" },
  confirmadas: { label: "Confirmadas", statusKey: "confirmado", Icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-700" },
  entregues: { label: "Entregues", statusKey: "entregue", Icon: Truck, bg: "bg-sky-100", color: "text-sky-700" },
  canceladas: { label: "Canceladas", statusKey: "cancelado", Icon: XCircle, bg: "bg-[#C98A75]/20", color: "text-[#C98A75]" },
};

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function EncomendasLista() {
  const { status = "total" } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const { encomendas, deleteEncomenda } = useEncomendas();
  const [tagsDisponiveis, setTagsDisponiveis] = useState<any[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  const cfg = STATUS_MAP[status] || STATUS_MAP.total;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("tags_encomendas")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("ativo", true)
        .order("padrao_sistema", { ascending: false })
        .order("nome");
      setTagsDisponiveis(data || []);
    })();
  }, []);

  const encomendasMes = useMemo(() => {
    if (!encomendas) return [] as any[];
    return encomendas.filter((enc: any) => {
      if (!enc.data_entrega) return false;
      const d = parseISOToDate(enc.data_entrega);
      return d.getMonth() === mesSelecionado && d.getFullYear() === anoSelecionado;
    });
  }, [encomendas, mesSelecionado, anoSelecionado]);

  const clientesComEncomendas = useMemo(
    () => Array.from(new Set(encomendas.map((e: any) => e.cliente).filter((c: string) => c && c.trim() !== ""))).sort(),
    [encomendas],
  );

  const total = useMemo(
    () => (cfg.statusKey ? encomendasMes.filter((e: any) => e.status === cfg.statusKey).length : encomendasMes.length),
    [encomendasMes, cfg.statusKey],
  );

  const handleEdit = (encomenda: any) => {
    navigate(`/encomendas?id=${encomenda.id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta encomenda?")) {
      try {
        await deleteEncomenda(id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir encomenda");
      }
    }
  };

  const handleDarBaixa = async (encomenda: any) => {
    if (!encomenda.conta_receber_id) {
      toast.error("Esta encomenda não possui conta a receber vinculada.");
      return;
    }
    try {
      const { data: parcelas } = await supabase
        .from("contas_receber_parcelas")
        .select("*")
        .eq("conta_receber_id", encomenda.conta_receber_id)
        .order("numero_parcela", { ascending: true })
        .limit(1);
      if (!parcelas || parcelas.length === 0) {
        toast.error("Nenhuma parcela encontrada.");
        return;
      }
      navigate(`/financeiro/contas-receber/detalhes/${encomenda.conta_receber_id}`, {
        state: {
          parcelaId: parcelas[0].id,
          voltarPara: `/encomendas/lista/${status}`,
          encomendaId: encomenda.id,
        },
      });
    } catch {
      toast.error("Erro ao buscar parcela.");
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/encomendas")}
          className="border-[#3D2F28]/20 text-[#2A1F1A]"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Voltar
        </Button>
        <PageHeader title={`Encomendas - ${cfg.label}`} />
      </div>

      {/* Filtro Mês/Ano */}
      <div className="rounded-2xl border border-[#3D2F28]/10 bg-white px-4 sm:px-5 py-4 shadow-[0_2px_12px_-8px_rgba(91,26,43,0.12)]">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-6">
          <div className="flex items-center gap-2 text-[#2A1F1A]">
            <CalendarDays className="h-5 w-5 text-[#3D2F28]" />
            <span className="font-semibold">Período:</span>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Label className="text-sm text-foreground/60">Ano</Label>
            <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
              <SelectTrigger className="h-9 flex-1 sm:w-28 rounded-md border-[#3D2F28]/20 bg-white text-[#2A1F1A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Label className="text-sm text-foreground/60">Mês</Label>
            <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
              <SelectTrigger className="h-9 flex-1 sm:w-36 rounded-md border-[#3D2F28]/20 bg-white text-[#2A1F1A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {meses.map((mes, index) => (
                  <SelectItem key={index} value={index.toString()}>{mes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <EncomendaStatusCard
        label={cfg.label}
        value={total}
        Icon={cfg.Icon}
        bg={cfg.bg}
        color={cfg.color}
        statusKey={cfg.statusKey}
        encomendas={encomendasMes}
        clientesComEncomendas={clientesComEncomendas}
        tagsDisponiveis={tagsDisponiveis}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDarBaixa={handleDarBaixa}
        defaultExpanded
      />
    </div>
  );
}
