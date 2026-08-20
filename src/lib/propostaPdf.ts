import jsPDF from "jspdf";
import type { Proposta } from "@/types/proposta";

interface BusinessInfo {
  nome_confeitaria?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  logomarca_url?: string | null;
}

const VINHO = "#3D2F28";
const DOURADO = "#C98A75";
const PRETO = "#3D2F28";

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function gerarPropostaPDF(proposta: Proposta, business: BusinessInfo): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  let y = 15;

  // Cabeçalho vinho
  doc.setFillColor(VINHO);
  doc.rect(0, 0, pageW, 35, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(business.nome_confeitaria || "Minha Confeitaria", 15, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const subline = [business.telefone, business.email].filter(Boolean).join("  ·  ");
  if (subline) doc.text(subline, 15, 25);
  if (business.endereco) doc.text(business.endereco, 15, 30);

  // Título "Proposta"
  doc.setTextColor(DOURADO);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`PROPOSTA Nº ${String(proposta.numero).padStart(4, "0")}`, pageW - 15, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "normal");
  doc.text(`Emissão: ${formatDate(proposta.data_emissao)}`, pageW - 15, 25, { align: "right" });
  if (proposta.data_validade) doc.text(`Válida até: ${formatDate(proposta.data_validade)}`, pageW - 15, 30, { align: "right" });

  y = 45;

  // Cliente
  doc.setTextColor(VINHO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CLIENTE", 15, y);
  doc.setDrawColor(DOURADO);
  doc.line(15, y + 1, pageW - 15, y + 1);
  y += 6;
  doc.setTextColor(PRETO);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nome: ${proposta.cliente_nome}`, 15, y); y += 5;
  if (proposta.cliente_telefone) { doc.text(`Telefone: ${proposta.cliente_telefone}`, 15, y); y += 5; }
  if (proposta.cliente_email) { doc.text(`E-mail: ${proposta.cliente_email}`, 15, y); y += 5; }
  const enderecoParts = [
    proposta.cliente_endereco_rua,
    proposta.cliente_endereco_numero,
    proposta.cliente_endereco_complemento,
    proposta.cliente_endereco_bairro,
    proposta.cliente_endereco_cidade,
    proposta.cliente_endereco_estado,
  ].filter(Boolean);
  if (enderecoParts.length > 0) {
    doc.text(`Endereço: ${enderecoParts.join(", ")}`, 15, y, { maxWidth: pageW - 30 });
    y += 5;
  }

  y += 4;

  // Produtos
  doc.setTextColor(VINHO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ITENS", 15, y);
  doc.line(15, y + 1, pageW - 15, y + 1);
  y += 6;

  // Header tabela
  doc.setFillColor(DOURADO);
  doc.rect(15, y, pageW - 30, 7, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(9);
  doc.text("ITEM", 18, y + 5);
  doc.text("QTD", 130, y + 5, { align: "right" });
  doc.text("UNIT", 160, y + 5, { align: "right" });
  doc.text("TOTAL", pageW - 18, y + 5, { align: "right" });
  y += 10;

  doc.setTextColor(PRETO);
  doc.setFont("helvetica", "normal");
  proposta.produtos.forEach((p) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text(p.nome.substring(0, 60), 18, y);
    doc.text(String(p.quantidade), 130, y, { align: "right" });
    doc.text(brl(p.preco_unitario), 160, y, { align: "right" });
    doc.text(brl(p.quantidade * p.preco_unitario), pageW - 18, y, { align: "right" });
    y += 6;
  });

  y += 4;
  doc.setDrawColor(DOURADO);
  doc.line(120, y, pageW - 15, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 130, y, { align: "right" });
  doc.text(brl(proposta.subtotal), pageW - 18, y, { align: "right" });
  y += 5;
  if (proposta.desconto > 0) {
    doc.text("Desconto:", 130, y, { align: "right" });
    doc.text(`- ${brl(proposta.desconto)}`, pageW - 18, y, { align: "right" });
    y += 5;
  }
  if (proposta.frete > 0) {
    doc.text("Frete:", 130, y, { align: "right" });
    doc.text(brl(proposta.frete), pageW - 18, y, { align: "right" });
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(VINHO);
  doc.setFontSize(12);
  doc.text("TOTAL:", 130, y + 2, { align: "right" });
  doc.text(brl(proposta.valor_total), pageW - 18, y + 2, { align: "right" });

  y += 12;
  doc.setTextColor(PRETO);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (proposta.forma_pagamento) {
    doc.text(`Forma de pagamento: ${proposta.forma_pagamento}`, 15, y);
    y += 5;
  }
  if (proposta.data_entrega) {
    doc.text(`Data de entrega: ${formatDate(proposta.data_entrega)}`, 15, y);
    y += 5;
  }
  if (proposta.observacoes) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const split = doc.splitTextToSize(proposta.observacoes, pageW - 30);
    doc.text(split, 15, y);
  }

  return doc;
}
