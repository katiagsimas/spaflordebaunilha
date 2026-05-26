import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePropostas } from "@/hooks/usePropostas";
import { propostaService } from "@/services/propostaService";
import { useBusinessProfile, montarEnderecoCompleto } from "@/hooks/useBusinessProfile";
import { gerarPropostaPDF } from "@/lib/propostaPdf";
import type { Proposta, PropostaProduto, PropostaStatus } from "@/types/proposta";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

function uid() { return Math.random().toString(36).slice(2, 11); }
function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function NovaProposta() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editingId = params.get("id");
  const { create, update } = usePropostas();
  const { data: business } = useBusinessProfile();

  const { data: existing } = useQuery({
    queryKey: ["proposta", editingId],
    queryFn: () => propostaService.getById(editingId!),
    enabled: !!editingId,
  });

  const [form, setForm] = useState<Partial<Proposta>>({
    cliente_nome: "", cliente_telefone: "", cliente_email: "",
    cliente_endereco_rua: "", cliente_endereco_numero: "", cliente_endereco_bairro: "",
    cliente_endereco_cidade: "", cliente_endereco_estado: "",
    produtos: [], desconto: 0, frete: 0,
    data_emissao: new Date().toISOString().slice(0, 10),
    data_validade: "", data_entrega: "",
    forma_pagamento: "", observacoes: "",
    status: "rascunho",
  });

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const produtos = (form.produtos ?? []) as PropostaProduto[];
  const subtotal = produtos.reduce((acc, p) => acc + p.quantidade * p.preco_unitario, 0);
  const valor_total = Math.max(0, subtotal - (form.desconto ?? 0) + (form.frete ?? 0));

  function setField<K extends keyof Proposta>(key: K, val: Proposta[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addProduto() {
    setForm((f) => ({
      ...f,
      produtos: [...(f.produtos ?? []), { id: uid(), nome: "", quantidade: 1, preco_unitario: 0 } as PropostaProduto],
    }));
  }

  function updProduto(id: string, patch: Partial<PropostaProduto>) {
    setForm((f) => ({
      ...f,
      produtos: (f.produtos ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function delProduto(id: string) {
    setForm((f) => ({ ...f, produtos: (f.produtos ?? []).filter((p) => p.id !== id) }));
  }

  async function handleSave(): Promise<Proposta | null> {
    if (!form.cliente_nome?.trim()) { toast.error("Informe o nome do cliente"); return null; }
    if (produtos.length === 0) { toast.error("Adicione pelo menos um item"); return null; }
    if (produtos.some((p) => !p.nome.trim())) { toast.error("Todos os itens precisam de nome"); return null; }

    if (editingId) {
      return await update.mutateAsync({ id: editingId, input: form });
    } else {
      return await create.mutateAsync(form as Proposta & { cliente_nome: string });
    }
  }

  async function handleSaveAndExit() {
    const saved = await handleSave();
    if (saved) navigate("/comercial/propostas");
  }

  async function handleSaveAndPdf() {
    const saved = await handleSave();
    if (!saved) return;
    const doc = gerarPropostaPDF(saved, {
      ...business,
      endereco: montarEnderecoCompleto(business),
      logomarca_url: business?.logo_url,
    } as never);
    doc.save(`proposta-${String(saved.numero).padStart(4, "0")}.pdf`);
  }

  return (
    <div className="flex-1">
      <PageHeader
        title={editingId ? "Editar proposta" : "Nova proposta"}
        description="Preencha os dados do cliente e os itens do orçamento."
        backButton={
          <Button variant="ghost" size="icon" onClick={() => navigate("/comercial/propostas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveAndPdf}>
              <Download className="h-4 w-4 mr-2" /> Salvar + PDF
            </Button>
            <Button className="bg-cda-vinho hover:bg-cda-vinho-escuro text-white" onClick={handleSaveAndExit}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* CLIENTE */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cda-vinho">Dados do cliente</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.cliente_nome ?? ""} onChange={(e) => setField("cliente_nome", e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.cliente_telefone ?? ""} onChange={(e) => setField("cliente_telefone", e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.cliente_email ?? ""} onChange={(e) => setField("cliente_email", e.target.value)} />
              </div>
              <div>
                <Label>CPF / CNPJ</Label>
                <Input value={form.cliente_documento ?? ""} onChange={(e) => setField("cliente_documento", e.target.value)} />
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.cliente_endereco_rua ?? ""} onChange={(e) => setField("cliente_endereco_rua", e.target.value)} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.cliente_endereco_numero ?? ""} onChange={(e) => setField("cliente_endereco_numero", e.target.value)} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={form.cliente_endereco_bairro ?? ""} onChange={(e) => setField("cliente_endereco_bairro", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Cidade</Label>
                <Input value={form.cliente_endereco_cidade ?? ""} onChange={(e) => setField("cliente_endereco_cidade", e.target.value)} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={form.cliente_endereco_estado ?? ""} onChange={(e) => setField("cliente_endereco_estado", e.target.value)} />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={form.cliente_endereco_cep ?? ""} onChange={(e) => setField("cliente_endereco_cep", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ITENS */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cda-vinho">Itens do orçamento</h2>
              <Button size="sm" variant="outline" onClick={addProduto}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar item
              </Button>
            </div>
            {produtos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum item ainda. Clique em "Adicionar item".
              </p>
            )}
            <div className="space-y-3">
              {produtos.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-md">
                  <div className="col-span-12 md:col-span-5">
                    <Label className="text-xs">Item</Label>
                    <Input value={p.nome} onChange={(e) => updProduto(p.id, { nome: e.target.value })} placeholder="Ex.: Bolo 2kg recheado" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs">Qtd</Label>
                    <Input type="number" min={1} value={p.quantidade} onChange={(e) => updProduto(p.id, { quantidade: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs">Preço un.</Label>
                    <Input type="number" min={0} step={0.01} value={p.preco_unitario} onChange={(e) => updProduto(p.id, { preco_unitario: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right text-sm">
                    <Label className="text-xs">Total</Label>
                    <div className="h-10 flex items-center justify-end font-semibold text-cda-vinho">{brl(p.quantidade * p.preco_unitario)}</div>
                  </div>
                  <div className="col-span-1">
                    <Button size="icon" variant="ghost" onClick={() => delProduto(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 grid md:grid-cols-3 gap-4">
              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.desconto ?? 0} onChange={(e) => setField("desconto", Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Frete (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.frete ?? 0} onChange={(e) => setField("frete", Number(e.target.value) || 0)} />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Subtotal: {brl(subtotal)}</p>
                <p className="text-2xl font-bold text-cda-vinho">{brl(valor_total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CONDIÇÕES */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-cda-vinho">Condições e observações</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Emissão</Label>
                <Input type="date" value={form.data_emissao ?? ""} onChange={(e) => setField("data_emissao", e.target.value)} />
              </div>
              <div>
                <Label>Validade</Label>
                <Input type="date" value={form.data_validade ?? ""} onChange={(e) => setField("data_validade", e.target.value)} />
              </div>
              <div>
                <Label>Entrega</Label>
                <Input type="date" value={form.data_entrega ?? ""} onChange={(e) => setField("data_entrega", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Forma de pagamento</Label>
                <Input value={form.forma_pagamento ?? ""} onChange={(e) => setField("forma_pagamento", e.target.value)} placeholder="Ex.: 50% sinal + 50% retirada" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status ?? "rascunho"} onValueChange={(v) => setField("status", v as PropostaStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="aceita">Aceita</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} value={form.observacoes ?? ""} onChange={(e) => setField("observacoes", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
