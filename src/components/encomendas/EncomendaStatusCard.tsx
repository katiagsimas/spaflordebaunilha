import { useMemo, useState } from "react";
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
} from "lucide-react";
import { parseISOToDate } from "@/lib/dateUtils";
import { gerarOrdemProducao, gerarPedidoCliente } from "@/utils/gerarPedidoPDF";
import { toast } from "sonner";

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
  "batizado",
  "casamento",
  "noivado",
  "chá de bebê",
  "chá de fraldas",
  "empresarial",
];

export interface EncomendaStatusCardProps {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bg: string;
  color: string;
  /** Status que define quais encomendas entram (null = todas) */
  statusKey: string | null;
  encomendas: any[];
  clientesComEncomendas: string[];
  tagsDisponiveis: any[];
  onEdit: (encomenda: any) => void;
  onDelete: (id: string) => void;
  onDarBaixa: (encomenda: any) => void;
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
}: EncomendaStatusCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clienteFilter, setClienteFilter] = useState("Todos");
  const [origemFilter, setOrigemFilter] = useState("todos");
  const [eventoFilter, setEventoFilter] = useState("todos");
  const [dataEntregaFilter, setDataEntregaFilter] = useState("");

  const origensTags = useMemo(
    () => tagsDisponiveis.filter((t) => ORIGEM_NOMES.includes(t.nome.toLowerCase())),
    [tagsDisponiveis],
  );
  const eventoTags = useMemo(
    () => tagsDisponiveis.filter((t) => EVENTO_NOMES.includes(t.nome.toLowerCase())),
    [tagsDisponiveis],
  );

  const lista = useMemo(() => {
    return encomendas
      .filter((e) => (statusKey ? e.status === statusKey : true))
      .filter((e) => clienteFilter === "Todos" || e.cliente === clienteFilter)
      .filter((e) =>
        origemFilter === "todos"
          ? true
          : e.tags?.some((t: any) => t.id === origemFilter),
      )
      .filter((e) =>
        eventoFilter === "todos"
          ? true
          : e.tags?.some((t: any) => t.id === eventoFilter),
      )
      .filter((e) =>
        !dataEntregaFilter ? true : e.data_entrega === dataEntregaFilter,
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime(),
      );
  }, [
    encomendas,
    statusKey,
    clienteFilter,
    origemFilter,
    eventoFilter,
    dataEntregaFilter,
  ]);

  const limparFiltros = () => {
    setClienteFilter("Todos");
    setOrigemFilter("todos");
    setEventoFilter("todos");
    setDataEntregaFilter("");
    toast.success("Filtros limpos com sucesso!");
  };

  return (
    <div className="rounded-xl border border-[#5B1A2B]/10 bg-white shadow-[0_2px_12px_-8px_rgba(91,26,43,0.10)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="w-full p-4 flex items-center gap-3 hover:bg-[#5B1A2B]/[0.02] transition-colors text-left"
        aria-expanded={expanded}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bg}`}
        >
          <Icon className={`h-5 w-5 ${color}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-foreground/55">
            {label}
          </p>
          <p className="font-display text-[28px] font-normal leading-none text-[#3D0F1C]">
            {value}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-[#5B1A2B]/60 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#5B1A2B]/10 bg-[#FDF6EE]/40">
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
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
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
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.cor }}
                        />
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
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.cor }}
                        />
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
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                onClick={limparFiltros}
              >
                <X className="h-3 w-3 mr-1.5" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Lista */}
          <div className="px-4 pb-4">
            {lista.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-[#5B1A2B]/5">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma encomenda encontrada
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg border border-[#5B1A2B]/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
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
                        <TableCell className="font-medium">
                          {encomenda.cliente}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusColors[encomenda.status]}
                            variant="outline"
                          >
                            {statusLabels[encomenda.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(encomenda.data_pedido).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                        <TableCell>
                          {encomenda.data_entrega ? (
                            parseISOToDate(
                              encomenda.data_entrega,
                            ).toLocaleDateString("pt-BR")
                          ) : (
                            <Badge
                              className="bg-red-100 text-red-800 border-red-200"
                              variant="outline"
                            >
                              Aguardando
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {encomenda.hora_entrega
                            ? encomenda.hora_entrega.slice(0, 5)
                            : "-"}
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
                                      style={{
                                        backgroundColor: tag.cor,
                                        color: "#fff",
                                      }}
                                      className="text-xs"
                                    >
                                      {tag.nome}
                                    </Badge>
                                  ))
                                : null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          R$ {Number(encomenda.valor || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {encomenda.conta_receber_id &&
                              encomenda.status === "pendente" && (
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Imprimir"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await gerarPedidoCliente(encomenda.id);
                                    } catch (e: any) {
                                      toast.error(
                                        e?.message || "Erro ao gerar PDF",
                                      );
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
                                      toast.error(
                                        e?.message || "Erro ao gerar PDF",
                                      );
                                    }
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  Ordem de produção
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(encomenda)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(encomenda.id)}
                            >
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
