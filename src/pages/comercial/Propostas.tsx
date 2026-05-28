import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FileText, Plus, Edit, Trash2, Download, BarChart3, FileSpreadsheet, Send, CheckCircle2, Coins, LayoutList, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePropostas } from "@/hooks/usePropostas";
import { useBusinessProfile, montarEnderecoCompleto } from "@/hooks/useBusinessProfile";
import { gerarPropostaPDF } from "@/lib/propostaPdf";
import { STATUS_LABELS, type PropostaStatus } from "@/types/proposta";
import type { Proposta } from "@/types/proposta";

const STATUS_COLOR: Record<PropostaStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviada: "bg-cda-dourado/20 text-cda-vinho border border-cda-dourado/40",
  aceita: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  rejeitada: "bg-red-100 text-red-800 border border-red-300",
  expirada: "bg-amber-100 text-amber-800 border border-amber-300",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function Propostas() {
  const navigate = useNavigate();
  const { propostas, stats, remove } = usePropostas();
  const { data: business } = useBusinessProfile();
  const [toDelete, setToDelete] = useState<Proposta | null>(null);

  const data = propostas.data ?? [];
  const s = stats.data;

  const handleDownload = (p: Proposta) => {
    const doc = gerarPropostaPDF(p, {
      ...business,
      endereco: montarEnderecoCompleto(business),
      logomarca_url: business?.logo_url,
    } as never);
    doc.save(`proposta-${String(p.numero).padStart(4, "0")}.pdf`);
  };

  return (
    <div className="flex-1">
      <PageHeader
        title="Propostas"
        description="Crie e gerencie orçamentos para os seus clientes."
        backButton={
          <Button variant="ghost" size="sm" className="gap-1 text-cda-vinho" onClick={() => navigate("/comercial/negociacoes")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <NavLink to="/comercial/propostas/relatorio">
                <BarChart3 className="h-4 w-4 mr-2" /> Relatório
              </NavLink>
            </Button>
          </div>
        }
      />

      <div className="px-6 pb-2">
        <Button className="bg-cda-vinho hover:bg-cda-vinho-escuro text-white" asChild>
          <NavLink to="/comercial/propostas/nova">
            <Plus className="h-4 w-4 mr-2" /> Nova proposta
          </NavLink>
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats premium */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: s?.total ?? 0, icon: LayoutList, tone: "vinho" as const },
            { label: "Rascunho", value: s?.rascunho ?? 0, icon: FileText, tone: "dourado" as const },
            { label: "Enviadas", value: s?.enviada ?? 0, icon: Send, tone: "vinho" as const },
            { label: "Aceitas", value: s?.aceita ?? 0, icon: CheckCircle2, tone: "dourado" as const },
            { label: "Ticket médio", value: formatBRL(s?.ticket_medio ?? 0), icon: Coins, tone: "vinho" as const },
          ].map((kpi) => {
            const Icon = kpi.icon;
            const ring = kpi.tone === "vinho" ? "bg-cda-vinho/10 text-cda-vinho" : "bg-cda-dourado/20 text-cda-vinho";
            return (
              <Card
                key={kpi.label}
                className="rounded-2xl border border-cda-dourado/20 bg-cda-branco shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)]"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ring-1 ring-cda-dourado/40 ${ring}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide font-body text-cda-vinho/60">{kpi.label}</p>
                    <p className="font-display text-xl text-cda-vinho-escuro mt-0.5 truncate">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabela */}
        <Card className="rounded-2xl border border-cda-dourado/20 bg-cda-branco shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] overflow-hidden">
          <CardContent className="p-0">
            {data.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-cda-dourado/60 mb-3" />
                <p className="text-lg font-semibold">Nenhuma proposta cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">Crie sua primeira proposta clicando no botão acima.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{String(p.numero).padStart(4, "0")}</TableCell>
                      <TableCell className="font-medium">{p.cliente_nome}</TableCell>
                      <TableCell>{formatDateBR(p.data_emissao)}</TableCell>
                      <TableCell>{formatDateBR(p.data_validade)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLOR[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatBRL(Number(p.valor_total))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleDownload(p)} title="Baixar PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/comercial/propostas/nova?id=${p.id}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(p)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              A proposta nº {toDelete?.numero} do cliente <b>{toDelete?.cliente_nome}</b> será excluída.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (toDelete) { remove.mutate(toDelete.id); setToDelete(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
