import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR } from "@/lib/dateUtils";

// Paleta Caixa de Açúcar
const COR_PRETO: [number, number, number] = [28, 28, 28];
const COR_DOURADO: [number, number, number] = [198, 168, 90];
const COR_PISTACHE: [number, number, number] = [191, 207, 184];
const COR_CLOUD: [number, number, number] = [245, 244, 241];
const COR_CINZA: [number, number, number] = [120, 120, 120];

const fmtBRL = (v: number) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function carregarImagemDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function carregarDados(encomendaId: string) {
  const [{ data: encomenda }, { data: itens }, { data: tagsRel }] = await Promise.all([
    supabase.from("encomendas").select("*").eq("id", encomendaId).maybeSingle(),
    supabase
      .from("encomenda_itens")
      .select("*")
      .eq("encomenda_id", encomendaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("encomendas_tags")
      .select("tag:tags_encomendas(nome, cor)")
      .eq("encomenda_id", encomendaId),
  ]);

  if (!encomenda) throw new Error("Encomenda não encontrada");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: empresa } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  let cliente: any = null;
  if (encomenda.cliente) {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("nome", encomenda.cliente)
      .maybeSingle();
    cliente = data;
  }

  const tags = (tagsRel ?? []).map((t: any) => t.tag).filter(Boolean);

  return { encomenda, itens: itens ?? [], empresa, cliente, tags };
}

async function desenharCabecalho(doc: jsPDF, empresa: any, titulo: string) {
  const pageW = doc.internal.pageSize.getWidth();
  // Faixa superior
  doc.setFillColor(...COR_PRETO);
  doc.rect(0, 0, pageW, 28, "F");

  // Logo
  if (empresa?.avatar_url) {
    const dataUrl = await carregarImagemDataURL(empresa.avatar_url);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", 12, 5, 18, 18);
      } catch {}
    }
  }

  // Nome empresa
  doc.setTextColor(...COR_CLOUD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(empresa?.nome_confeitaria || "Confeitaria", 35, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const contato = [empresa?.whatsapp || empresa?.telefone, empresa?.email]
    .filter(Boolean)
    .join("  •  ");
  if (contato) doc.text(contato, 35, 19);

  // Título do documento (faixa dourada)
  doc.setFillColor(...COR_DOURADO);
  doc.rect(0, 28, pageW, 9, "F");
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(titulo.toUpperCase(), pageW / 2, 34.2, { align: "center" });
}

function desenharRodape(doc: jsPDF, encomendaId: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...COR_DOURADO);
  doc.setLineWidth(0.3);
  doc.line(12, pageH - 14, pageW - 12, pageH - 14);
  doc.setTextColor(...COR_CINZA);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text(
    `Documento gerado em ${new Date().toLocaleString("pt-BR")}  •  Pedido #${encomendaId
      .slice(0, 8)
      .toUpperCase()}`,
    pageW / 2,
    pageH - 9,
    { align: "center" }
  );
  doc.text("Caixa de Açúcar by Umbrella Doce", pageW / 2, pageH - 5, { align: "center" });
}

function bloco(doc: jsPDF, x: number, y: number, w: number, h: number, titulo: string) {
  doc.setDrawColor(...COR_DOURADO);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2);
  doc.setFillColor(...COR_DOURADO);
  doc.roundedRect(x, y, w, 5, 2, 2, "F");
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(titulo.toUpperCase(), x + 2, y + 3.6);
}

function texto(doc: jsPDF, x: number, y: number, label: string, valor: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COR_CINZA);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COR_PRETO);
  doc.setFontSize(9);
  doc.text(valor || "-", x, y + 4);
}

// ====================================================
// 1) PEDIDO PARA O CLIENTE
// ====================================================
export async function gerarPedidoCliente(encomendaId: string) {
  const { encomenda, itens, empresa, cliente, tags } = await carregarDados(encomendaId);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  await desenharCabecalho(doc, empresa, "Pedido");

  let y = 44;

  // Bloco do cliente
  bloco(doc, 12, y, pageW - 24, 26, "Cliente");
  texto(doc, 14, y + 11, "NOME", encomenda.cliente);
  texto(doc, pageW / 2, y + 11, "TELEFONE", encomenda.telefone || cliente?.telefone || "-");
  const enderecoLinha = [
    encomenda.endereco || cliente?.endereco,
    encomenda.numero,
    encomenda.cep || cliente?.cep,
  ]
    .filter(Boolean)
    .join(", ");
  texto(doc, 14, y + 21, "ENDEREÇO DE ENTREGA", enderecoLinha || "Retirar no local");
  y += 30;

  // Bloco da encomenda
  bloco(doc, 12, y, pageW - 24, 22, "Detalhes do Pedido");
  texto(doc, 14, y + 11, "DATA DO PEDIDO", formatDateBR(encomenda.data_pedido));
  texto(
    doc,
    pageW / 3 + 4,
    y + 11,
    "DATA DE ENTREGA",
    encomenda.data_entrega ? formatDateBR(encomenda.data_entrega) : "A combinar"
  );
  texto(
    doc,
    (pageW / 3) * 2 + 4,
    y + 11,
    "HORA",
    encomenda.hora_entrega ? encomenda.hora_entrega.slice(0, 5) : "-"
  );
  y += 26;

  // Tabela de itens
  autoTable(doc, {
    startY: y,
    head: [["Produto", "Qtd", "Un.", "Valor Un.", "Subtotal"]],
    body: itens.map((i: any) => [
      i.produto,
      String(i.quantidade),
      i.unidade_medida,
      fmtBRL(Number(i.valor_unitario)),
      fmtBRL(Number(i.subtotal)),
    ]),
    margin: { left: 12, right: 12 },
    styles: { fontSize: 9, cellPadding: 2.5, textColor: COR_PRETO },
    headStyles: { fillColor: COR_PISTACHE, textColor: COR_PRETO, fontStyle: "bold" },
    alternateRowStyles: { fillColor: COR_CLOUD },
    columnStyles: {
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 32 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // Topo de bolo (se houver)
  if (encomenda.topo_tema || encomenda.topo_aniversariante || encomenda.topo_obs) {
    bloco(doc, 12, y, pageW - 24, 22, "Topo de Bolo / Personalização");
    texto(doc, 14, y + 11, "TEMA", encomenda.topo_tema || "-");
    texto(doc, pageW / 2, y + 11, "ANIVERSARIANTE", encomenda.topo_aniversariante || "-");
    if (encomenda.topo_obs) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...COR_PRETO);
      doc.text(`Obs: ${encomenda.topo_obs}`, 14, y + 19, { maxWidth: pageW - 28 });
    }
    y += 26;
  }

  // Resumo financeiro
  const subtotal = itens.reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0);
  const descontoPerc = (subtotal * Number(encomenda.desconto_percentual || 0)) / 100;
  const desconto = descontoPerc + Number(encomenda.desconto_valor || 0);
  const adicionais =
    Number(encomenda.taxa_entrega || 0) +
    Number(encomenda.topo_bolo || 0) +
    Number(encomenda.outros || 0);

  const resumoX = pageW - 92;
  bloco(doc, resumoX, y, 80, 50, "Resumo");
  let ry = y + 10;
  const linhaResumo = (label: string, valor: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...COR_PRETO);
    doc.text(label, resumoX + 3, ry);
    doc.text(valor, resumoX + 77, ry, { align: "right" });
    ry += 6;
  };
  linhaResumo("Subtotal", fmtBRL(subtotal));
  if (desconto > 0) linhaResumo("Desconto", `- ${fmtBRL(desconto)}`);
  if (Number(encomenda.taxa_entrega || 0) > 0)
    linhaResumo("Taxa de entrega", fmtBRL(Number(encomenda.taxa_entrega)));
  if (Number(encomenda.topo_bolo || 0) > 0)
    linhaResumo("Topo de bolo", fmtBRL(Number(encomenda.topo_bolo)));
  if (Number(encomenda.outros || 0) > 0)
    linhaResumo("Outros", fmtBRL(Number(encomenda.outros)));
  doc.setDrawColor(...COR_DOURADO);
  doc.line(resumoX + 3, ry - 3, resumoX + 77, ry - 3);
  linhaResumo("TOTAL", fmtBRL(Number(encomenda.valor || 0)), true);

  // Pagamentos
  const pagamentos: any[] = Array.isArray(encomenda.pagamentos) ? (encomenda.pagamentos as any[]) : [];
  const pago: number = pagamentos
    .filter((p: any) => p.pago)
    .reduce((s: number, p: any) => s + Number(p.valor || 0), 0);
  const saldo: number = Number(encomenda.valor || 0) - pago;

  bloco(doc, 12, y, resumoX - 16, 50, "Pagamento");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_PRETO);
  doc.text(`Total pago: ${fmtBRL(pago)}`, 14, y + 12);
  doc.text(`Saldo restante: ${fmtBRL(Math.max(0, saldo))}`, 14, y + 19);
  if (pagamentos.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...COR_CINZA);
    doc.text("Lançamentos:", 14, y + 28);
    pagamentos.slice(0, 4).forEach((p: any, idx: number) => {
      const linha = `${p.data ? formatDateBR(p.data) : "-"}  ${p.tipo_pagamento || ""}  ${fmtBRL(
        Number(p.valor || 0)
      )}  ${p.pago ? "✓" : "○"}`;
      doc.text(linha, 14, y + 34 + idx * 4);
    });
  }
  y += 56;

  // Observações ao cliente
  if (encomenda.observacoes || encomenda.observacoes_cliente) {
    bloco(doc, 12, y, pageW - 24, 22, "Observações");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COR_PRETO);
    doc.text(encomenda.observacoes_cliente || encomenda.observacoes || "", 14, y + 11, {
      maxWidth: pageW - 28,
    });
  }

  desenharRodape(doc, encomenda.id);
  doc.save(`Pedido_${(encomenda.cliente || "cliente").replace(/\s+/g, "_")}.pdf`);
}

// ====================================================
// 2) ORDEM DE PRODUÇÃO (interna)
// ====================================================
export async function gerarOrdemProducao(encomendaId: string) {
  const { encomenda, itens, empresa, tags } = await carregarDados(encomendaId);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  await desenharCabecalho(doc, empresa, "Ordem de Produção");

  let y = 44;

  // Resumo de prazo / cliente
  bloco(doc, 12, y, pageW - 24, 22, "Atendimento");
  texto(doc, 14, y + 11, "CLIENTE", encomenda.cliente);
  texto(
    doc,
    pageW / 3 + 4,
    y + 11,
    "ENTREGA",
    encomenda.data_entrega
      ? `${formatDateBR(encomenda.data_entrega)}${
          encomenda.hora_entrega ? "  " + encomenda.hora_entrega.slice(0, 5) : ""
        }`
      : "A combinar"
  );
  texto(doc, (pageW / 3) * 2 + 4, y + 11, "STATUS", String(encomenda.status || "-").toUpperCase());
  y += 26;

  // Tags / tipo de evento
  if (tags.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COR_CINZA);
    doc.text("CATEGORIAS / EVENTO:", 12, y);
    let tx = 50;
    tags.forEach((t: any) => {
      const txt = String(t.nome ?? "");
      const w = Number(doc.getTextWidth(txt)) + 6;
      doc.setFillColor(...COR_PISTACHE);
      doc.roundedRect(tx, y - 3.5, w, 5, 1, 1, "F");
      doc.setTextColor(...COR_PRETO);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(txt, tx + 3, y);
      tx += w + 3;
    });
    y += 6;
  }

  // Itens a produzir
  autoTable(doc, {
    startY: y,
    head: [["#", "Receita / Produto", "Quantidade", "Unidade", "Checklist"]],
    body: itens.map((i: any, idx: number) => [
      String(idx + 1),
      i.produto,
      String(i.quantidade),
      i.unidade_medida,
      "(   )",
    ]),
    margin: { left: 12, right: 12 },
    styles: { fontSize: 10, cellPadding: 3, textColor: COR_PRETO, minCellHeight: 9 },
    headStyles: { fillColor: COR_PRETO, textColor: COR_CLOUD, fontStyle: "bold" },
    alternateRowStyles: { fillColor: COR_CLOUD },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "center", cellWidth: 22 },
      4: { halign: "center", cellWidth: 22 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // Topo de bolo destacado (importante para produção)
  if (
    encomenda.topo_tema ||
    encomenda.topo_aniversariante ||
    encomenda.topo_idade ||
    encomenda.topo_obs
  ) {
    bloco(doc, 12, y, pageW - 24, 30, "Topo de Bolo / Personalização");
    texto(doc, 14, y + 11, "TEMA", encomenda.topo_tema || "-");
    texto(doc, pageW / 3 + 4, y + 11, "ANIVERSARIANTE", encomenda.topo_aniversariante || "-");
    texto(doc, (pageW / 3) * 2 + 4, y + 11, "IDADE", encomenda.topo_idade || "-");
    if (encomenda.topo_obs) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...COR_PRETO);
      doc.text(`Obs: ${encomenda.topo_obs}`, 14, y + 21, { maxWidth: pageW - 28 });
    }
    const imgs = Array.isArray(encomenda.topo_imagens) ? encomenda.topo_imagens : [];
    if (imgs.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(...COR_CINZA);
      doc.text(`(${imgs.length} imagem(ns) anexada(s) — ver no sistema)`, pageW - 14, y + 27, {
        align: "right",
      });
    }
    y += 34;
  }

  // Observações
  bloco(doc, 12, y, pageW - 24, 28, "Observações para Produção");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COR_PRETO);
  const obsTexto = [encomenda.observacoes, encomenda.observacoes_internas]
    .filter(Boolean)
    .join("\n");
  doc.text(obsTexto || "—", 14, y + 11, { maxWidth: pageW - 28 });
  y += 32;

  // Espaço para apontamentos
  bloco(doc, 12, y, pageW - 24, 38, "Apontamentos da Produção");
  doc.setDrawColor(...COR_CINZA);
  doc.setLineWidth(0.1);
  [y + 12, y + 20, y + 28].forEach((ly) => doc.line(14, ly, pageW - 14, ly));
  doc.setFontSize(8);
  doc.setTextColor(...COR_CINZA);
  doc.text("Responsável:", 14, y + 36);
  doc.line(36, y + 36, pageW / 2 - 4, y + 36);
  doc.text("Concluído em:", pageW / 2, y + 36);
  doc.line(pageW / 2 + 22, y + 36, pageW - 14, y + 36);

  desenharRodape(doc, encomenda.id);
  doc.save(`OP_${(encomenda.cliente || "cliente").replace(/\s+/g, "_")}.pdf`);
}
