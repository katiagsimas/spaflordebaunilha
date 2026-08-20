import jsPDF from "jspdf";
import type { Contrato, TemplateContrato } from "@/types/contrato";

interface BusinessInfo {
  nome_confeitaria?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  assinatura_url?: string | null;
}

const VINHO = "#3D2F28";
const DOURADO = "#C98A75";

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Substitui {{key}} no template pelo valor correspondente em data. */
export function renderTemplate(corpo: string, data: Record<string, unknown>, business: BusinessInfo): string {
  const merged: Record<string, unknown> = {
    ...data,
    business_name: business.nome_confeitaria || "",
    business_document: business.cnpj || "",
    business_phone: business.telefone || "",
    business_email: business.email || "",
    business_address: business.endereco || "",
    data_atual: formatDate(new Date().toISOString().slice(0, 10)),
  };

  return corpo.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key) => {
    const val = merged[key];
    if (val === undefined || val === null) return "_______________";
    if (typeof val === "number" && key.toLowerCase().includes("valor")) return brl(val);
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return formatDate(val);
    return String(val);
  });
}

export function gerarContratoPDF(
  contrato: Contrato,
  template: TemplateContrato,
  business: BusinessInfo
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const marginX = 20;
  const marginTop = 20;
  const marginBottom = 25;
  let y = marginTop;

  // Cabeçalho
  doc.setFillColor(VINHO);
  doc.rect(0, 0, pageW, 8, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text((business.nome_confeitaria || "").toUpperCase(), marginX, 5.5);
  doc.text(`CONTRATO Nº ${String(contrato.numero).padStart(4, "0")}`, pageW - marginX, 5.5, { align: "right" });

  y = 22;
  doc.setTextColor(VINHO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(template.nome.toUpperCase(), pageW / 2, y, { align: "center" });
  doc.setDrawColor(DOURADO);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - 30, y + 2, pageW / 2 + 30, y + 2);
  y += 12;

  // Corpo
  const corpoRender = renderTemplate(template.corpo, contrato.form_data, business);
  doc.setTextColor("#3D2F28");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(corpoRender, pageW - marginX * 2);
  for (const line of lines) {
    if (y > pageH - marginBottom - 10) {
      doc.addPage();
      y = marginTop;
    }
    doc.text(line, marginX, y);
    y += 5.2;
  }

  // Assinaturas
  if (y > pageH - 50) { doc.addPage(); y = marginTop; }
  y += 15;
  const colW = (pageW - marginX * 2 - 10) / 2;
  doc.setDrawColor("#3D2F28");
  doc.line(marginX, y, marginX + colW, y);
  doc.line(marginX + colW + 10, y, pageW - marginX, y);
  doc.setFontSize(9);
  doc.text("CONTRATADA", marginX + colW / 2, y + 5, { align: "center" });
  doc.text(business.nome_confeitaria || "", marginX + colW / 2, y + 10, { align: "center" });
  doc.text("CONTRATANTE", marginX + colW + 10 + colW / 2, y + 5, { align: "center" });
  doc.text(contrato.cliente_nome, marginX + colW + 10 + colW / 2, y + 10, { align: "center" });

  return doc;
}
