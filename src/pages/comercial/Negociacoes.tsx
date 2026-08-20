import { useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FileSignature, ScrollText, Coins, TrendingUp, Search, X, Plus,
  Edit, Trash2, Download, Eye, CheckCircle2, Send, FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePropostas } from "@/hooks/usePropostas";
import { useContratos } from "@/hooks/useContratos";
import { useBusinessProfile, montarEnderecoCompleto } from "@/hooks/useBusinessProfile";
import { gerarPropostaPDF } from "@/lib/propostaPdf";
import { STATUS_LABELS as PROPOSTA_STATUS_LABELS, type PropostaStatus, type Proposta } from "@/types/proposta";
import { CONTRATO_STATUS_LABELS, type ContratoStatus, type Contrato } from "@/types/contrato";
import negociacoesHero from "@/assets/negociacoes-hero.png";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDateBR(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const PROPOSTA_STATUS_COLOR: Record<PropostaStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviada: "bg-sfb-areia/20 text-sfb-cacau border border-sfb-areia/40",
  aceita: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  rejeitada: "bg-red-100 text-red-800 border border-red-300",
  expirada: "bg-amber-100 text-amber-800 border border-amber-300",
};
const CONTRATO_STATUS_COLOR: Record<ContratoStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-sfb-areia/20 text-sfb-cacau border border-sfb-areia/40",
  assinado: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  cancelado: "bg-red-100 text-red-800 border border-red-300",
};

export default function Negociacoes() {
  const navigate = useNavigate();
  const { propostas, stats: propostasStats, remove: removePr } = usePropostas();
  const { contratos, stats: contratosStats, remove: removeCt } = useContratos();
  const { data: business } = useBusinessProfile();

  const sP = propostasStats.data;
  const sC = contratosStats.data;

  // ---- KPIs ----
  const totalPropostas = sP?.total ?? 0;
  const totalContratos = sC?.total ?? 0;
  const aceitas = sP?.aceita ?? 0;
  const conversao = totalPropostas > 0 ? Math.round((aceitas / totalPropostas) * 100) : 0;
  const valorNegociado = (sP?.valor_total_aceitas ?? 0) + (sC?.valor_total ?? 0);

  const kpis = [
    { label: "Propostas", value: totalPropostas, sub: "Em andamento", icon: FileSignature },
    { label: "Contratos", value: totalContratos, sub: "Ativos", icon: ScrollText },
    { label: "Conversões", value: `${conversao}%`, sub: "Taxa de fechamento", icon: TrendingUp },
    { label: "Valor Negociado", value: brl(valorNegociado), sub: "Acumulado", icon: Coins },
  ];

  // ---- Filtros compartilhados ----
  const [tab, setTab] = useState<"propostas" | "contratos">("propostas");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const limparFiltros = () => {
    setBusca("");
    setStatusFiltro("todos");
    setDataInicio("");
    setDataFim("");
  };

  // ---- Dados filtrados ----
  const propostasFiltradas = useMemo(() => {
    const list = propostas.data ?? [];
    return list.filter((p) => {
      if (busca) {
        const q = busca.toLowerCase();
        const hit =
          p.cliente_nome.toLowerCase().includes(q) ||
          String(p.numero).padStart(4, "0").includes(q);
        if (!hit) return false;
      }
      if (statusFiltro !== "todos" && p.status !== statusFiltro) return false;
      if (dataInicio && p.data_emissao < dataInicio) return false;
      if (dataFim && p.data_emissao > dataFim) return false;
      return true;
    });
  }, [propostas.data, busca, statusFiltro, dataInicio, dataFim]);

  const contratosFiltrados = useMemo(() => {
    const list = contratos.data ?? [];
    return list.filter((c) => {
      if (busca) {
        const q = busca.toLowerCase();
        const hit =
          c.cliente_nome.toLowerCase().includes(q) ||
          String(c.numero).padStart(4, "0").includes(q) ||
          (c.template_nome || "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (statusFiltro !== "todos" && c.status !== statusFiltro) return false;
      const ref = c.data_evento ?? c.created_at?.slice(0, 10) ?? "";
      if (dataInicio && ref && ref < dataInicio) return false;
      if (dataFim && ref && ref > dataFim) return false;
      return true;
    });
  }, [contratos.data, busca, statusFiltro, dataInicio, dataFim]);

  // ---- Ações ----
  const [toDeletePr, setToDeletePr] = useState<Proposta | null>(null);
  const [toDeleteCt, setToDeleteCt] = useState<Contrato | null>(null);

  const handleDownloadProposta = (p: Proposta) => {
    const doc = gerarPropostaPDF(p, {
      ...business,
      endereco: montarEnderecoCompleto(business),
      logomarca_url: business?.logo_url,
    } as never);
    doc.save(`proposta-${String(p.numero).padStart(4, "0")}.pdf`);
  };

  // Status options conforme aba
  const statusOptions =
    tab === "propostas"
      ? Object.entries(PROPOSTA_STATUS_LABELS)
      : Object.entries(CONTRATO_STATUS_LABELS);

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-24">
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        {/* ===== HEADER PREMIUM ===== */}
        <div
          className="relative overflow-hidden rounded-2xl border border-[#3D2F28]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
          style={{ background: "#FAEFEB" }}
        >
          <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pr-[150px] sm:pr-[200px] lg:pr-[260px] min-h-[130px] sm:min-h-[150px] lg:min-h-[170px]">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-normal leading-tight text-[#2A1F1A] sm:text-3xl lg:text-[36px]">
                Negociações
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-px w-8 bg-sfb-terracota sm:w-10" />
                <p className="text-xs italic text-[#C98A75] sm:text-sm">
                  Acompanhe suas negociações do início ao fechamento.
                </p>
              </div>
            </div>
          </div>
          <img
            src={negociacoesHero}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 h-[140px] w-auto -translate-y-1/2 object-contain sm:h-[180px] lg:h-[220px]"
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="rounded-2xl border-2 border-[#C98A75]/60 bg-sfb-baunilha shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)]"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center ring-1 ring-sfb-dourado/40 bg-sfb-areia/15 text-sfb-cacau">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide font-body text-sfb-cacau/60">
                      {kpi.label}
                    </p>
                    <p className="font-display text-xl text-sfb-cacau-escuro mt-0.5 truncate">
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{kpi.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ===== TABS + FILTROS + TABELA ===== */}
        <Card className="rounded-2xl border-2 border-[#C98A75]/60 bg-white shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] overflow-hidden">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "propostas" | "contratos");
              setStatusFiltro("todos");
            }}
          >
            {/* Header com tabs + ação */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#3D2F28]/10 px-4 sm:px-6 pt-4">
              <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none justify-start">
                <TabsTrigger
                  value="propostas"
                  className="relative rounded-md border-0 px-3 pb-2 pt-2 font-display text-[15px] text-[#2A1F1A]/60 data-[state=active]:bg-sfb-terracota data-[state=active]:text-sfb-baunilha data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all"
                >
                  Propostas
                </TabsTrigger>
                <TabsTrigger
                  value="contratos"
                  className="relative rounded-md border-0 px-3 pb-2 pt-2 font-display text-[15px] text-[#2A1F1A]/60 data-[state=active]:bg-sfb-terracota data-[state=active]:text-sfb-baunilha data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all"
                >
                  Contratos
                </TabsTrigger>
              </TabsList>

              <div className="pb-3 sm:pb-0">
                {tab === "propostas" ? (
                  <Button asChild className="bg-sfb-terracota hover:bg-sfb-terracota-escuro text-sfb-baunilha">
                    <NavLink to="/comercial/propostas/nova">
                      <Plus className="h-4 w-4 mr-2" /> Nova proposta
                    </NavLink>
                  </Button>
                ) : (
                  <Button
                    className="bg-sfb-terracota hover:bg-sfb-terracota-escuro text-sfb-baunilha"
                    onClick={() => navigate("/comercial/contratos")}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Novo contrato
                  </Button>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 sm:px-6 py-4 bg-[#FBF6EE]/40 border-b border-[#3D2F28]/10">
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sfb-cacau/50" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por cliente, modelo ou número…"
                  className="pl-9 bg-white border-[#3D2F28]/15"
                />
              </div>

              <div className="md:col-span-2">
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger className="bg-white border-[#3D2F28]/15">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {statusOptions.map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 flex items-center gap-2">
                <span className="text-xs text-sfb-cacau/70 whitespace-nowrap font-medium">Período:</span>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-white border-[#3D2F28]/15"
                />
                <span className="text-xs text-sfb-cacau/50">a</span>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-white border-[#3D2F28]/15"
                />
              </div>

              <div className="md:col-span-1">
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="w-full border-[#3D2F28]/20 text-sfb-cacau hover:bg-sfb-areia hover:text-sfb-cacau hover:border-sfb-areia"
                >
                  <X className="h-4 w-4 mr-1" /> Limpar
                </Button>
              </div>
            </div>

            {/* Conteúdo das tabs */}
            <TabsContent value="propostas" className="m-0">
              {propostasFiltradas.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <FileText className="h-12 w-12 mx-auto text-sfb-dourado/60 mb-3" />
                  <p className="text-lg font-semibold text-sfb-cacau-escuro">
                    Nenhuma proposta encontrada
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste os filtros ou crie uma nova proposta.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FBF6EE]/60">
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propostasFiltradas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sfb-cacau">
                          PRO-{String(p.numero).padStart(5, "0")}
                        </TableCell>
                        <TableCell className="font-medium">{p.cliente_nome}</TableCell>
                        <TableCell>{formatDateBR(p.data_emissao)}</TableCell>
                        <TableCell>{formatDateBR(p.data_validade)}</TableCell>
                        <TableCell>
                          <Badge className={PROPOSTA_STATUS_COLOR[p.status]}>
                            {PROPOSTA_STATUS_LABELS[p.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {brl(Number(p.valor_total))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownloadProposta(p)}
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/comercial/propostas/nova?id=${p.id}`)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setToDeletePr(p)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="contratos" className="m-0">
              {contratosFiltrados.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <ScrollText className="h-12 w-12 mx-auto text-sfb-dourado/60 mb-3" />
                  <p className="text-lg font-semibold text-sfb-cacau-escuro">
                    Nenhum contrato encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste os filtros ou gere um novo contrato.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FBF6EE]/60">
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contratosFiltrados.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sfb-cacau">
                          CTR-{String(c.numero).padStart(5, "0")}
                        </TableCell>
                        <TableCell className="font-medium">{c.cliente_nome}</TableCell>
                        <TableCell>{c.template_nome}</TableCell>
                        <TableCell>{formatDateBR(c.data_evento)}</TableCell>
                        <TableCell>
                          <Badge className={CONTRATO_STATUS_COLOR[c.status]}>
                            {CONTRATO_STATUS_LABELS[c.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {brl(Number(c.valor_total))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate("/comercial/contratos")}
                              title="Ver"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setToDeleteCt(c)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Confirmação de exclusão - Proposta */}
      <AlertDialog open={!!toDeletePr} onOpenChange={(o) => !o && setToDeletePr(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              A proposta nº {toDeletePr?.numero} do cliente <b>{toDeletePr?.cliente_nome}</b> será
              excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (toDeletePr) {
                  removePr.mutate(toDeletePr.id);
                  setToDeletePr(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de exclusão - Contrato */}
      <AlertDialog open={!!toDeleteCt} onOpenChange={(o) => !o && setToDeleteCt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              O contrato nº {toDeleteCt?.numero} de <b>{toDeleteCt?.cliente_nome}</b> será excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (toDeleteCt) {
                  removeCt.mutate(toDeleteCt.id);
                  setToDeleteCt(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
