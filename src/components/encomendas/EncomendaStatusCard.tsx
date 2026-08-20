import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ClipboardCheck,
  FileText,
  HandCoins,
  Pencil,
  Printer,
  ShoppingBag,
  Trash2,
  X,
  CalendarRange,
  Inbox,
  Truck as TruckIcon,
  Sun,
  List as ListIcon,
} from "lucide-react";
import { parseISOToDate, getTodayISO } from "@/lib/dateUtils";
import { gerarOrdemProducao, gerarPedidoCliente } from "@/utils/gerarPedidoPDF";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  em_producao: "bg-purple-100 text-purple-800 border-purple-200",
  pronto: "bg-green-100 text-green-800 border-green-200",
  entregue: "bg-gray-100 text-gray-800 border-gray-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em Produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const ORIGEM_NOMES = [
  "instagram",
  "whatsapp",
  "indicação",
  "google maps",
  "fidelização interna",
  "parceria local",
];

const EVENTO_NOMES = [
  "aniversário infantil",
  "aniversário adulto",
  "mesversário",
  "aniversário",
  "batizado",
  "casamento",
  "noivado",
  "chá de bebê",
  "chá de fraldas",
  "empresarial",
  "bodas",
  "corporativo",
  "infantil",
  "personalizado",
];

const TIMELINE_STEPS = [
  { key: "pedido", label: "Pedido" },
  { key: "confirmado", label: "Confirmado" },
  { key: "em_producao", label: "Produção" },
  { key: "pronto", label: "Pronto" },
  { key: "entregue", label: "Entregue" },
] as const;

const STATUS_ORDER: Record<string, number> = {
  pendente: 0, // = Pedido
  confirmado: 1,
  em_producao: 2,
  pronto: 3,
  entregue: 4,
  cancelado: -1,
};

function EncomendaTimeline({ status }: { status: string }) {
  const isCancelado = status === "cancelado";
  const currentIdx = STATUS_ORDER[status] ?? 0;
  return (
    <div className="flex items-center gap-1 min-w-[180px]" title={`Status: ${statusLabels[status] ?? status}`}>
      {TIMELINE_STEPS.map((step, i) => {
        const reached = !isCancelado && i <= currentIdx;
        const isCurrent = !isCancelado && i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full border transition-colors",
                  isCancelado && "border-rose-300 bg-rose-100",
                  !isCancelado && reached && "border-sfb-terracota bg-sfb-terracota",
                  !isCancelado && !reached && "border-sfb-terracota/25 bg-white",
                  isCurrent && "ring-2 ring-sfb-areia ring-offset-1",
                )}
              />
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <span
                className={cn(
                  "h-0.5 flex-1 min-w-[8px]",
                  isCancelado && "bg-rose-200",
                  !isCancelado && i < currentIdx && "bg-sfb-terracota",
                  !isCancelado && i >= currentIdx && "bg-sfb-terracota/15",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type QuickFilter = "todas" | "em_aberto" | "hoje" | "entregues";
type SortBy = "criado_desc" | "entrega_asc" | "entrega_desc" | "valor_desc";

interface PersistedState {
  cliente: string;
  origem: string;
  evento: string;
  dataEntrega: string;
  quick: QuickFilter;
  sortBy: SortBy;
}

const DEFAULT_STATE: PersistedState = {
  cliente: "Todos",
  origem: "todos",
  evento: "todos",
  dataEntrega: "",
  quick: "todas",
  sortBy: "criado_desc",
};

function loadPersisted(key: string): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export interface EncomendaStatusCardProps {
  label: string;
  value: number;
  Icon: React.ComponentType<any>;
  bg: string;
  color: string;
  statusKey: string | null;
  encomendas: any[];
  clientesComEncomendas: string[];
  tagsDisponiveis: any[];
  onEdit: (encomenda: any) => void;
  onDelete: (id: string) => void;
  onDarBaixa: (encomenda: any) => void;
  defaultExpanded?: boolean;
}

export function EncomendaStatusCard({
  label,
  value,
  Icon,
  bg,
  color,
  statusKey,
  encomendas,
  clientesComEncomendas,
  tagsDisponiveis,
  onEdit,
  onDelete,
  onDarBaixa,
  defaultExpanded = false,
}: EncomendaStatusCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const persistKey = `cda:enclista:${statusKey ?? "total"}`;

  const initial = loadPersisted(persistKey);
  const [clienteFilter, setClienteFilter] = useState(initial.cliente);
  const [origemFilter, setOrigemFilter] = useState(initial.origem);
  const [eventoFilter, setEventoFilter] = useState(initial.evento);
  const [dataEntregaFilter, setDataEntregaFilter] = useState(initial.dataEntrega);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(initial.quick);
  const [sortBy, setSortBy] = useState<SortBy>(initial.sortBy);

  // Persistência
  useEffect(() => {
    try {
      const payload: PersistedState = {
        cliente: clienteFilter,
        origem: origemFilter,
        evento: eventoFilter,
        dataEntrega: dataEntregaFilter,
        quick: quickFilter,
        sortBy,
      };
      window.localStorage.setItem(persistKey, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [persistKey, clienteFilter, origemFilter, eventoFilter, dataEntregaFilter, quickFilter, sortBy]);

  const origensTags = useMemo(
    () => tagsDisponiveis.filter((t) => ORIGEM_NOMES.includes(t.nome.toLowerCase())),
    [tagsDisponiveis],
  );
  const eventoTags = useMemo(
    () => tagsDisponiveis.filter((t) => EVENTO_NOMES.includes(t.nome.toLowerCase())),
    [tagsDisponiveis],
  );

  const hojeISO = getTodayISO();

  const lista = useMemo(() => {
    const filtered = encomendas
      .filter((e) => (statusKey ? e.status === statusKey : true))
      .filter((e) => {
        if (quickFilter === "todas") return true;
        if (quickFilter === "em_aberto")
          return e.status !== "entregue" && e.status !== "cancelado";
        if (quickFilter === "entregues") return e.status === "entregue";
        if (quickFilter === "hoje") return e.data_entrega === hojeISO;
        return true;
      })
      .filter((e) => clienteFilter === "Todos" || e.cliente === clienteFilter)
      .filter((e) =>
        origemFilter === "todos" ? true : e.tags?.some((t: any) => t.id === origemFilter),
      )
      .filter((e) =>
        eventoFilter === "todos" ? true : e.tags?.some((t: any) => t.id === eventoFilter),
      )
      .filter((e) => (!dataEntregaFilter ? true : e.data_entrega === dataEntregaFilter));

    const cmp = (a: any, b: any) => {
      if (sortBy === "criado_desc")
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      if (sortBy === "entrega_asc")
        return (a.data_entrega ?? "z").localeCompare(b.data_entrega ?? "z");
      if (sortBy === "entrega_desc")
        return (b.data_entrega ?? "").localeCompare(a.data_entrega ?? "");
      if (sortBy === "valor_desc") return Number(b.valor || 0) - Number(a.valor || 0);
      return 0;
    };
    return [...filtered].sort(cmp);
  }, [encomendas, statusKey, quickFilter, clienteFilter, origemFilter, eventoFilter, dataEntregaFilter, sortBy, hojeISO]);

  const limparFiltros = () => {
    setClienteFilter("Todos");
    setOrigemFilter("todos");
    setEventoFilter("todos");
    setDataEntregaFilter("");
    setQuickFilter("todas");
    setSortBy("criado_desc");
    toast.success("Filtros limpos");
  };

  const quickChips: { key: QuickFilter; label: string; Icon: any }[] = [
    { key: "todas", label: "Todas", Icon: ListIcon },
    { key: "em_aberto", label: "Em aberto", Icon: Inbox },
    { key: "hoje", label: "Hoje", Icon: Sun },
    { key: "entregues", label: "Entregues", Icon: TruckIcon },
  ];

  return (
    <div className="rounded-xl border border-sfb-cacau/10 bg-white shadow-[0_2px_12px_-8px_rgba(91,26,43,0.10)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="w-full p-4 flex items-center gap-3 hover:bg-sfb-cacau/[0.02] transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-foreground/55">{label}</p>
          <p className="font-display text-[28px] font-normal leading-none text-sfb-cacau">{value}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-sfb-cacau/60 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-sfb-cacau/10 bg-sfb-baunilha/40">
          {/* Quick chips + ordenação */}
          <div className="px-4 pt-4 flex flex-wrap items-center gap-2">
            {quickChips.map((c) => {
              const ChipIcon = c.Icon;
              const active = quickFilter === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setQuickFilter(c.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                    active
                      ? "border-sfb-terracota bg-sfb-terracota text-sfb-baunilha shadow-sm"
                      : "border-sfb-terracota/20 bg-white text-sfb-terracota hover:bg-sfb-baunilha/60",
                  )}
                >
                  <ChipIcon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-xs text-foreground/60">Ordenar:</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="h-8 w-48 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="criado_desc">Mais recentes (criação)</SelectItem>
                  <SelectItem value="entrega_asc">Entrega mais próxima</SelectItem>
                  <SelectItem value="entrega_desc">Entrega mais distante</SelectItem>
                  <SelectItem value="valor_desc">Maior valor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <div>
              <Label className="text-xs mb-1.5 block">Cliente</Label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="bg-background h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Todos">Todos os clientes</SelectItem>
                  {clientesComEncomendas.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Origem</Label>
              <Select value={origemFilter} onValueChange={setOrigemFilter}>
                <SelectTrigger className="bg-background h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="todos">Todas</SelectItem>
                  {origensTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                        {tag.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Evento</Label>
              <Select value={eventoFilter} onValueChange={setEventoFilter}>
                <SelectTrigger className="bg-background h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="todos">Todos</SelectItem>
                  {eventoTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                        {tag.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Data de Entrega</Label>
              <Input
                type="date"
                value={dataEntregaFilter}
                onChange={(e) => setDataEntregaFilter(e.target.value)}
                className="bg-background h-9 text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" size="sm" className="w-full h-9 text-xs" onClick={limparFiltros}>
                <X className="h-3 w-3 mr-1.5" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Lista */}
          <div className="px-4 pb-4">
            {lista.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-[#3D2F28]/5">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma encomenda encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg border border-[#3D2F28]/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="min-w-[200px]">Progresso</TableHead>
                      <TableHead>Data Pedido</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo de Evento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.map((encomenda) => (
                      <TableRow key={encomenda.id}>
                        <TableCell className="font-medium">{encomenda.cliente}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[encomenda.status]} variant="outline">
                            {statusLabels[encomenda.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <EncomendaTimeline status={encomenda.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(encomenda.data_pedido).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {encomenda.data_entrega ? (
                            parseISOToDate(encomenda.data_entrega).toLocaleDateString("pt-BR")
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
                              Aguardando
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {encomenda.hora_entrega ? encomenda.hora_entrega.slice(0, 5) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(() => {
                              const tiposEventoTags =
                                encomenda.tags?.filter((tag: any) =>
                                  EVENTO_NOMES.includes(tag.nome.toLowerCase()),
                                ) || [];
                              return tiposEventoTags.length > 0
                                ? tiposEventoTags.map((tag: any) => (
                                    <Badge
                                      key={tag.id}
                                      style={{ backgroundColor: tag.cor, color: "#fff" }}
                                      className="text-xs"
                                    >
                                      {tag.nome}
                                    </Badge>
                                  ))
                                : null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>R$ {Number(encomenda.valor || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {encomenda.conta_receber_id && encomenda.status === "pendente" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDarBaixa(encomenda)}
                                title="Dar Baixa"
                              >
                                <HandCoins className="h-4 w-4 text-success" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="Imprimir">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await gerarPedidoCliente(encomenda.id);
                                    } catch (e: any) {
                                      toast.error(e?.message || "Erro ao gerar PDF");
                                    }
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Pedido para o cliente
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await gerarOrdemProducao(encomenda.id);
                                    } catch (e: any) {
                                      toast.error(e?.message || "Erro ao gerar PDF");
                                    }
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  Ordem de produção
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="icon" onClick={() => onEdit(encomenda)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(encomenda.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
