import jsPDF from "jspdf";
import { ResumoMes } from "@/hooks/useMeuSalario";
import { formatBRL } from "@/lib/formatUtils";
import { CENARIOS, FRASES_RENDA_DOCE } from "@/pages/meu-salario/copy";

export function exportarMeuSalarioPDF(resumo: ResumoMes) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cores Renda Doce
  const vinho: [number, number, number] = [99, 36, 51];
  const dourado: [number, number, number] = [196, 159, 85];
  const creme: [number, number, number] = [250, 244, 235];
  const preto: [number, number, number] = [40, 30, 30];

  // Fundo creme topo
  doc.setFillColor(...creme);
  doc.rect(0, 0, pageWidth, 140, "F");

  // Título
  doc.setTextColor(...vinho);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Meu Salário", 40, 60);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...dourado);
  doc.text("Método Renda Doce", 40, 80);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...preto);
  doc.text(`Mês de referência: ${resumo.rotuloMes}`, 40, 110);

  // Linha separadora
  doc.setDrawColor(...dourado);
  doc.setLineWidth(0.8);
  doc.line(40, 150, pageWidth - 40, 150);

  // Bloco números
  let y = 180;
  const linha = (label: string, valor: string, destaque = false) => {
    doc.setFont("helvetica", destaque ? "bold" : "normal");
    doc.setFontSize(destaque ? 12 : 11);
    doc.setTextColor(...(destaque ? vinho : preto));
    doc.text(label, 50, y);
    doc.text(valor, pageWidth - 50, y, { align: "right" });
    y += 24;
  };

  linha("Faturamento", formatBRL(resumo.faturamento));
  linha("Custos", `- ${formatBRL(resumo.custos)}`);
  linha("Margem de segurança (20%)", `- ${formatBRL(resumo.margemSeguranca)}`);
  doc.setDrawColor(220, 200, 170);
  doc.line(50, y - 16, pageWidth - 50, y - 16);
  linha("Pró-labore saudável sugerido", formatBRL(resumo.proLaboreSaudavel), true);
  y += 8;
  linha("Retiradas realizadas", formatBRL(resumo.retiradas));
  linha("Saldo restante saudável", formatBRL(resumo.saldoRestante), true);

  // Cenário
  y += 24;
  const cenario = CENARIOS[resumo.cenario];
  doc.setFillColor(...creme);
  doc.roundedRect(40, y, pageWidth - 80, 90, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...vinho);
  doc.text(cenario.titulo, 56, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...preto);
  const linhasMsg = doc.splitTextToSize(cenario.mensagem, pageWidth - 110);
  doc.text(linhasMsg, 56, y + 44);

  // Frase
  const frase = FRASES_RENDA_DOCE[Math.floor(Math.random() * FRASES_RENDA_DOCE.length)];
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...dourado);
  doc.text(`"${frase}"`, pageWidth / 2, 760, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 140, 130);
  doc.text("Spa Flor de Baunilha • Método Renda Doce", pageWidth / 2, 790, { align: "center" });

  doc.save(`meu-salario-${resumo.mesReferencia}.pdf`);
}
