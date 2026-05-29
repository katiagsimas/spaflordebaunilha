import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarDays, FileDown, Plus, Search, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";

import { useNavigate } from "react-router-dom";
import calendarioMacaron from "@/assets/calendario-macaron.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Encomenda {
  id: string;
  cliente: string;
  data_entrega: string;
  hora_entrega: string;
  valor: number;
  status: string;
}

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

export function EncomendasDoDia({ onNovaEncomenda }: { onNovaEncomenda?: () => void } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hoje = new Date();
  const hojeStr = format(hoje, "yyyy-MM-dd");
  const [encomendasDia, setEncomendasDia] = useState<Encomenda[]>([]);
  const [buscaDia, setBuscaDia] = useState("");

  const carregar = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("encomendas")
      .select("id, data_entrega, hora_entrega, valor, status, cliente")
      .eq("usuario_id", user.id)
      .eq("data_entrega", hojeStr)
      .neq("status", "cancelado")
      .order("hora_entrega", { ascending: true });
    setEncomendasDia(
      (data || []).map((e) => ({
        id: e.id,
        cliente: e.cliente || "Cliente",
        data_entrega: e.data_entrega || "",
        hora_entrega: e.hora_entrega || "",
        valor: e.valor || 0,
        status: e.status || "pendente",
      })),
    );
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("encomendas-do-dia-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encomendas" },
        () => carregar(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const encomendasFiltradas = encomendasDia.filter((e) =>
    buscaDia.trim() === "" ? true : e.cliente.toLowerCase().includes(buscaDia.toLowerCase()),
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-[#C9A14A]/60 bg-cda-creme/40 shadow-[0_8px_30px_-18px_rgba(91,26,43,0.3)]">
      <CardHeader className="border-b border-cda-dourado/15 bg-cda-branco/60 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cda-vinho text-cda-dourado ring-1 ring-cda-dourado/40">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-xl tracking-tight text-cda-vinho-escuro sm:text-2xl">
                Encomendas do dia
              </CardTitle>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-body text-sm text-cda-vinho/80">
                  {format(hoje, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Badge className="bg-cda-dourado text-cda-preto hover:bg-cda-dourado tracking-[0.18em] text-[10px] uppercase">
                  Hoje
                </Badge>
                {encomendasDia.length > 0 && (
                  <Badge variant="outline" className="border-cda-vinho/20 text-cda-vinho">
                    {encomendasDia.length} encomenda{encomendasDia.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {encomendasDia.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cda-vinho/50" />
                <Input
                  value={buscaDia}
                  onChange={(e) => setBuscaDia(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="h-9 pl-9 bg-cda-branco border-cda-dourado/30 sm:w-56"
                />
              </div>
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
                  const csv = linhas
                    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
                    .join("\n");
                  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `encomendas-${hojeStr}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {encomendasDia.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-cda-dourado/40 bg-cda-branco/60 px-6 py-10 text-center md:flex-row md:items-center md:justify-center md:gap-10 md:text-left">
            <img
              src={calendarioMacaron}
              alt=""
              aria-hidden="true"
              className="pointer-events-none h-32 w-auto shrink-0 select-none object-contain sm:h-40"
            />
            <div className="flex flex-col items-center md:items-start">
              <h3 className="font-display text-xl tracking-tight text-cda-vinho-escuro sm:text-2xl">
                Nenhuma encomenda para hoje
              </h3>
              <p className="mt-2 max-w-md font-body text-sm text-cda-vinho/70">
                Você ainda não possui encomendas cadastradas para hoje. Que tal cadastrar a primeira?
              </p>
              {onNovaEncomenda && (
                <Button
                  onClick={onNovaEncomenda}
                  className="mt-5 gap-2 rounded-lg bg-cda-vinho text-cda-creme shadow-md transition hover:bg-cda-vinho-escuro tracking-[0.16em] text-xs uppercase"
                >
                  <Plus className="h-4 w-4" />
                  Nova Encomenda
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {encomendasFiltradas.map((encomenda) => (
              <button
                key={encomenda.id}
                type="button"
                onClick={() => navigate(`/encomendas?id=${encomenda.id}`)}
                className="group text-left rounded-xl border border-cda-dourado/20 bg-cda-branco p-4 shadow-[0_4px_18px_-14px_rgba(91,26,43,0.25)] transition hover:-translate-y-0.5 hover:border-cda-vinho/40 hover:shadow-[0_10px_28px_-16px_rgba(91,26,43,0.4)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base text-cda-vinho-escuro truncate">
                      {encomenda.cliente}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-cda-vinho/70">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {encomenda.hora_entrega || "Sem horário"}
                      </span>
                      <span className="font-semibold text-cda-vinho">
                        R$ {encomenda.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px] uppercase tracking-wider",
                      statusBadge[encomenda.status] ?? "",
                    )}
                  >
                    {statusLabel[encomenda.status] ?? encomenda.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-end text-[11px] font-semibold uppercase tracking-[0.18em] text-cda-vinho/60 transition group-hover:text-cda-vinho">
                  Ver detalhes →
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
