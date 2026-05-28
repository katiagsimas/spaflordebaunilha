import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ScrollText, Plus, Trash2, Download, FileText, ArrowLeft, Send, CheckCircle2, Coins, LayoutList } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContratos, useContratoTemplates } from "@/hooks/useContratos";
import { useBusinessProfile, montarEnderecoCompleto } from "@/hooks/useBusinessProfile";
import { gerarContratoPDF } from "@/lib/contratoPdf";
import { CONTRATO_STATUS_LABELS, type Contrato, type ContratoStatus, type TemplateContrato } from "@/types/contrato";
import { toast } from "sonner";

type View = "list" | "select-template" | "form";

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDateBR(iso: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const STATUS_COLOR: Record<ContratoStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-cda-dourado/20 text-cda-vinho border border-cda-dourado/40",
  assinado: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  cancelado: "bg-red-100 text-red-800 border border-red-300",
};

export default function Contratos() {
  const [view, setView] = useState<View>("list");
  const [tpl, setTpl] = useState<TemplateContrato | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState({
    cliente_nome: "", cliente_telefone: "", cliente_email: "", cliente_documento: "",
    valor_total: 0, data_evento: "", observacoes: "", status: "rascunho" as ContratoStatus,
  });
  const [toDelete, setToDelete] = useState<Contrato | null>(null);
  const navigate = useNavigate();

  const { contratos, stats, create, remove } = useContratos();
  const { data: templates = [] } = useContratoTemplates();
  const { data: business } = useBusinessProfile();

  const lista = contratos.data ?? [];
  const s = stats.data;

  function selectTemplate(t: TemplateContrato) {
    setTpl(t);
    const initial: Record<string, string> = {};
    t.campos.forEach((c) => { initial[c.key] = ""; });
    setForm(initial);
    setMeta({ cliente_nome: "", cliente_telefone: "", cliente_email: "", cliente_documento: "", valor_total: 0, data_evento: "", observacoes: "", status: "rascunho" });
    setView("form");
  }

  async function handleSave(generatePdf: boolean) {
    if (!tpl) return;
    if (!meta.cliente_nome.trim()) { toast.error("Informe o nome do cliente"); return; }
    const saved = await create.mutateAsync({
      template_id: tpl.id,
      template_nome: tpl.nome,
      cliente_nome: meta.cliente_nome,
      cliente_telefone: meta.cliente_telefone,
      cliente_email: meta.cliente_email,
      cliente_documento: meta.cliente_documento,
      valor_total: meta.valor_total,
      data_evento: meta.data_evento || null,
      observacoes: meta.observacoes || null,
      status: meta.status,
      form_data: form,
    });
    if (generatePdf && saved) {
      const doc = gerarContratoPDF(saved, tpl, {
        ...business,
        endereco: montarEnderecoCompleto(business),
      } as never);
      doc.save(`contrato-${String(saved.numero).padStart(4, "0")}.pdf`);
    }
    setView("list");
    setTpl(null);
  }

  function downloadExisting(c: Contrato) {
    const template = templates.find((t) => t.id === c.template_id);
    if (!template) { toast.error("Modelo não encontrado"); return; }
    const doc = gerarContratoPDF(c, template, { ...business, endereco: montarEnderecoCompleto(business) } as never);
    doc.save(`contrato-${String(c.numero).padStart(4, "0")}.pdf`);
  }

  // ----- VIEW: SELECT TEMPLATE -----
  if (view === "select-template") {
    return (
      <div className="flex-1">
        <PageHeader
          title="Escolha um modelo de contrato"
          description="Selecione o modelo que mais se aproxima do contrato que você precisa gerar."
          backButton={<Button variant="ghost" size="icon" onClick={() => setView("list")}><ArrowLeft className="h-5 w-5" /></Button>}
        />
        <div className="p-6 max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
          {templates.length === 0 && (
            <Card className="md:col-span-2"><CardContent className="p-10 text-center text-muted-foreground">
              Nenhum modelo disponível ainda.
            </CardContent></Card>
          )}
          {templates.map((t) => (
            <button key={t.id} onClick={() => selectTemplate(t)} className="text-left">
              <Card className="hover:border-cda-dourado transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{t.icone}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-cda-vinho">{t.nome}</h3>
                      {t.descricao && <p className="text-sm text-muted-foreground mt-1">{t.descricao}</p>}
                      <p className="text-xs text-cda-dourado mt-2">{t.campos.length} campos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ----- VIEW: FORM -----
  if (view === "form" && tpl) {
    return (
      <div className="flex-1">
        <PageHeader
          title={tpl.nome}
          description="Preencha os campos abaixo para gerar o contrato."
          backButton={<Button variant="ghost" size="icon" onClick={() => setView("select-template")}><ArrowLeft className="h-5 w-5" /></Button>}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave(true)}><Download className="h-4 w-4 mr-2" /> Salvar + PDF</Button>
              <Button className="bg-cda-vinho hover:bg-cda-vinho-escuro text-white" onClick={() => handleSave(false)}>Salvar</Button>
            </div>
          }
        />
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-cda-vinho">Dados do cliente</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={meta.cliente_nome} onChange={(e) => setMeta((m) => ({ ...m, cliente_nome: e.target.value }))} /></div>
                <div><Label>Telefone</Label><Input value={meta.cliente_telefone} onChange={(e) => setMeta((m) => ({ ...m, cliente_telefone: e.target.value }))} /></div>
                <div><Label>E-mail</Label><Input type="email" value={meta.cliente_email} onChange={(e) => setMeta((m) => ({ ...m, cliente_email: e.target.value }))} /></div>
                <div><Label>CPF / CNPJ</Label><Input value={meta.cliente_documento} onChange={(e) => setMeta((m) => ({ ...m, cliente_documento: e.target.value }))} /></div>
                <div><Label>Valor total (R$)</Label><Input type="number" min={0} step={0.01} value={meta.valor_total} onChange={(e) => setMeta((m) => ({ ...m, valor_total: Number(e.target.value) || 0 }))} /></div>
                <div><Label>Data do evento/entrega</Label><Input type="date" value={meta.data_evento} onChange={(e) => setMeta((m) => ({ ...m, data_evento: e.target.value }))} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-cda-vinho">Campos do contrato</h2>
              {tpl.campos.length === 0 && <p className="text-sm text-muted-foreground">Este modelo não exige campos adicionais.</p>}
              <div className="grid md:grid-cols-2 gap-4">
                {tpl.campos.map((c) => (
                  <div key={c.key} className={c.tipo === "textarea" ? "md:col-span-2" : ""}>
                    <Label>{c.label}{c.required && " *"}</Label>
                    {c.tipo === "textarea" ? (
                      <Textarea rows={3} value={form[c.key] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} placeholder={c.placeholder} />
                    ) : c.tipo === "select" ? (
                      <Select value={form[c.key] ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, [c.key]: v }))}>
                        <SelectTrigger><SelectValue placeholder={c.placeholder} /></SelectTrigger>
                        <SelectContent>{c.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={c.tipo === "currency" || c.tipo === "number" ? "number" : c.tipo === "date" ? "date" : c.tipo === "email" ? "email" : c.tipo === "tel" ? "tel" : "text"}
                        value={form[c.key] ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                        placeholder={c.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <Label>Observações internas</Label>
                <Textarea rows={2} value={meta.observacoes} onChange={(e) => setMeta((m) => ({ ...m, observacoes: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={meta.status} onValueChange={(v) => setMeta((m) => ({ ...m, status: v as ContratoStatus }))}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRATO_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ----- VIEW: LIST -----
  return (
    <div className="flex-1">
      <PageHeader
        title="Contratos"
        description="Gere contratos a partir de modelos prontos e acompanhe o status de cada um."
        backButton={
          <Button variant="ghost" size="sm" className="gap-1 text-cda-vinho" onClick={() => navigate("/comercial/negociacoes")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
        actions={
          <Button className="bg-cda-vinho hover:bg-cda-vinho-escuro text-white" onClick={() => setView("select-template")}>
            <Plus className="h-4 w-4 mr-2" /> Novo contrato
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: s?.total ?? 0, icon: LayoutList, tone: "vinho" as const },
            { label: "Rascunhos", value: s?.rascunhos ?? 0, icon: FileText, tone: "dourado" as const },
            { label: "Enviados", value: s?.enviados ?? 0, icon: Send, tone: "vinho" as const },
            { label: "Assinados", value: s?.assinados ?? 0, icon: CheckCircle2, tone: "dourado" as const },
            { label: "Valor total", value: brl(s?.valor_total ?? 0), icon: Coins, tone: "vinho" as const },
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

        <Card className="rounded-2xl border border-cda-dourado/20 bg-cda-branco shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] overflow-hidden">
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center py-16 px-6">
                <ScrollText className="h-12 w-12 mx-auto text-cda-dourado/60 mb-3" />
                <p className="text-lg font-semibold">Nenhum contrato cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">Clique em "Novo contrato" para começar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{String(c.numero).padStart(4, "0")}</TableCell>
                      <TableCell className="font-medium">{c.cliente_nome}</TableCell>
                      <TableCell>{c.template_nome}</TableCell>
                      <TableCell>{formatDateBR(c.data_evento)}</TableCell>
                      <TableCell><Badge className={STATUS_COLOR[c.status]}>{CONTRATO_STATUS_LABELS[c.status]}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{brl(Number(c.valor_total))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => downloadExisting(c)} title="Baixar PDF"><Download className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(c)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              O contrato nº {toDelete?.numero} de <b>{toDelete?.cliente_nome}</b> será excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (toDelete) { remove.mutate(toDelete.id); setToDelete(null); } }}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
