import jsPDF from "jspdf";
import { LoraRegular } from "@/assets/fonts/Lora-Regular";
import { LoraItalic } from "@/assets/fonts/Lora-Italic";
import { LoraBold } from "@/assets/fonts/Lora-Bold";
import { AREAS, ALL_BLOCKS, blockItems, type RitualState, type Block } from "./data";

let LORA_REGISTERED = false;
function registerLora(doc: jsPDF) {
  if (LORA_REGISTERED) {
    // jsPDF instances don't share VFS — always re-register on new doc
  }
  doc.addFileToVFS("Lora-Regular.ttf", LoraRegular);
  doc.addFont("Lora-Regular.ttf", "Lora", "normal");
  doc.addFileToVFS("Lora-Italic.ttf", LoraItalic);
  doc.addFont("Lora-Italic.ttf", "Lora", "italic");
  doc.addFileToVFS("Lora-Bold.ttf", LoraBold);
  doc.addFont("Lora-Bold.ttf", "Lora", "bold");
  LORA_REGISTERED = true;
}

const stripEmoji = (s: string) =>
  s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\uFE0F]/gu, "").trim();

export function generateRitualPDF(
  state: RitualState,
  blockIds: Set<string>,
  filter: "all" | "done" | "pending",
  phrase: { text: string; author: string },
  weekLabel: string,
  weekRange: string,
) {
  const grouped = AREAS
    .map((area) => ({
      area,
      blocks: area.blocks
        .filter((b) => blockIds.has(b.id))
        .map((block) => {
          const items = blockItems(block, state.custom).map((label, idx) => ({
            label, idx, done: !!state.done[`${block.id}-${idx}`],
          }));
          const filtered = items.filter((it) =>
            filter === "all" ? true : filter === "done" ? it.done : !it.done
          );
          return { block, items: filtered, totalRaw: items.length };
        })
        .filter((d) => filter === "all" ? true : d.items.length > 0),
    }))
    .filter((g) => g.blocks.length > 0);

  if (grouped.length === 0) return false;

  const WINE: [number, number, number] = [91, 26, 43];      // Vinho v2
  const WINE_DEEP: [number, number, number] = [61, 15, 28]; // Vinho escuro v2
  const GOLD: [number, number, number] = [201, 161, 74];    // Dourado v2
  const GOLD_SOFT: [number, number, number] = [232, 213, 163];
  const CREAM: [number, number, number] = [253, 246, 238];  // Creme v2
  const INK: [number, number, number] = [18, 18, 18];
  const MUTED: [number, number, number] = [130, 110, 95];

  const doc = new jsPDF({ unit: "pt", format: "a4", putOnlyUsedFonts: true });
  registerLora(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const filterLabel = filter === "all" ? "Checklist completo" : filter === "done" ? "Somente concluídas" : "Somente pendentes";
  const areasIncluded = AREAS.filter((a) => a.blocks.some((b) => blockIds.has(b.id)));
  const scopeLabel = areasIncluded.length === AREAS.length
    ? "Visão completa"
    : areasIncluded.map((a) => a.label).join(" · ") || "Personalizado";

  // ---------- COVER ----------
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFillColor(...WINE_DEEP);
  doc.rect(0, 0, pageW, 110, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(margin, 124, pageW - margin, 124);

  doc.setTextColor(...GOLD_SOFT);
  doc.setFont("Lora", "normal");
  doc.setFontSize(9);
  doc.text("CAIXA DE AÇÚCAR · KÁ SIMAS", pageW / 2, 50, { align: "center", charSpace: 3 });

  doc.setTextColor(245, 239, 230);
  doc.setFont("Lora", "italic");
  doc.setFontSize(34);
  doc.text("Organização Doce", pageW / 2, 90, { align: "center" });

  doc.setFont("Lora", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...WINE);
  doc.text("PLANNER EXECUTIVO DA CONFEITEIRA EMPRESÁRIA", pageW / 2, 170, { align: "center", charSpace: 2 });

  const ruleY = 195;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - 70, ruleY, pageW / 2 - 8, ruleY);
  doc.line(pageW / 2 + 8, ruleY, pageW / 2 + 70, ruleY);
  doc.setFillColor(...GOLD);
  doc.triangle(pageW / 2 - 4, ruleY, pageW / 2 + 4, ruleY, pageW / 2, ruleY - 4, "F");
  doc.triangle(pageW / 2 - 4, ruleY, pageW / 2 + 4, ruleY, pageW / 2, ruleY + 4, "F");

  doc.setFont("Lora", "italic");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  const phraseLines = doc.splitTextToSize(`"${phrase.text}"`, contentW - 60);
  let py = 240;
  phraseLines.forEach((ln: string) => {
    doc.text(ln, pageW / 2, py, { align: "center" });
    py += 22;
  });
  doc.setFont("Lora", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`— ${phrase.author}`, pageW / 2, py + 6, { align: "center" });

  const metaY = pageH - 230;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin + 40, metaY - 18, pageW - margin - 40, metaY - 18);

  const metaRow = (label: string, value: string, y: number) => {
    doc.setFont("Lora", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), margin + 60, y, { charSpace: 1.5 });
    doc.setFont("Lora", "italic");
    doc.setFontSize(12);
    doc.setTextColor(...WINE);
    doc.text(value, pageW - margin - 60, y, { align: "right" });
  };
  metaRow("Emitido em", dateStr, metaY);
  metaRow("Escopo", scopeLabel, metaY + 24);
  metaRow("Filtro", filterLabel, metaY + 48);
  if (state.startDate && weekLabel) {
    metaRow("Ciclo", `${weekLabel} · ${weekRange}`, metaY + 72);
  }

  doc.setFillColor(...WINE_DEEP);
  doc.rect(0, pageH - 70, pageW, 70, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(margin, pageH - 70, pageW - margin, pageH - 70);
  doc.setFont("Lora", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_SOFT);
  doc.text("Organização Doce · Caixa de Açúcar by Ká Simas", pageW / 2, pageH - 42, { align: "center", charSpace: 2 });
  doc.setTextColor(245, 239, 230);
  doc.setFontSize(9);
  doc.text("Conduza. Organize. Cresça.", pageW / 2, pageH - 24, { align: "center" });

  // ---------- INTERNAL PAGES ----------
  const headerH = 56;
  const footerH = 38;
  const topY = headerH + 24;
  const bottomY = pageH - footerH - 12;

  let pageNum = 1;
  const drawHeader = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.line(margin, headerH, pageW - margin, headerH);
    doc.setFont("Lora", "italic");
    doc.setFontSize(13);
    doc.setTextColor(...WINE_DEEP);
    doc.text("Organização Doce", margin, 32);
    doc.setFont("Lora", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(filterLabel.toUpperCase(), pageW - margin, 32, { align: "right", charSpace: 1.5 });
  };
  const drawFooter = () => {
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(margin, pageH - footerH, pageW - margin, pageH - footerH);
    doc.setFont("Lora", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Caixa de Açúcar by Ká Simas · Umbrella Doce", margin, pageH - 18, { charSpace: 1 });
    doc.text(`pág. ${pageNum}`, pageW - margin, pageH - 18, { align: "right" });
  };

  const newPage = () => {
    doc.addPage();
    pageNum += 1;
    drawHeader();
    drawFooter();
  };

  newPage();
  let y = topY;
  const ensureSpace = (needed: number) => {
    if (y + needed > bottomY) { newPage(); y = topY; }
  };

  grouped.forEach(({ area, blocks: areaBlocks }, gi) => {
    ensureSpace(60);
    doc.setFont("Lora", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text("CAPÍTULO", margin, y, { charSpace: 2.5 });
    doc.setFont("Lora", "italic");
    doc.setFontSize(22);
    doc.setTextColor(...WINE_DEEP);
    doc.text(area.label, margin, y + 22);
    doc.setFont("Lora", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const tagClean = stripEmoji(area.tagline);
    const tagLines = doc.splitTextToSize(tagClean, contentW);
    doc.text(tagLines, margin, y + 38);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 44 + (tagLines.length - 1) * 11, margin + 60, y + 44 + (tagLines.length - 1) * 11);
    y += 60 + (tagLines.length - 1) * 11;

    areaBlocks.forEach(({ block, items, totalRaw }: { block: Block; items: { label: string; idx: number; done: boolean }[]; totalRaw: number }) => {
      const cleanTitle = stripEmoji(block.title);
      const doneCount = blockItems(block, state.custom)
        .reduce((acc, _, i) => acc + (state.done[`${block.id}-${i}`] ? 1 : 0), 0);

      ensureSpace(46);
      doc.setFillColor(...WINE);
      doc.rect(margin, y, contentW, 28, "F");
      doc.setFillColor(...GOLD);
      doc.rect(margin, y, 4, 28, "F");
      doc.setFont("Lora", "bold");
      doc.setFontSize(13);
      doc.setTextColor(245, 239, 230);
      doc.text(cleanTitle, margin + 14, y + 18);
      doc.setFont("Lora", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GOLD_SOFT);
      doc.text(`${doneCount}/${totalRaw}`, margin + contentW - 10, y + 18, { align: "right" });
      y += 28 + 12;

      if (items.length === 0) {
        doc.setFont("Lora", "italic");
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text("Sem itens neste filtro.", margin + 14, y);
        y += 18;
      }

      doc.setFont("Lora", "normal");
      doc.setFontSize(10.5);
      items.forEach(({ label, done }) => {
        const text = stripEmoji(label);
        const lines = doc.splitTextToSize(text, contentW - 28);
        const blockH = Math.max(16, lines.length * 14 + 4);
        ensureSpace(blockH);

        const boxSize = 10;
        const boxX = margin + 6;
        const boxY = y - 8;
        doc.setDrawColor(...WINE);
        doc.setLineWidth(0.7);
        if (done) {
          doc.setFillColor(...WINE);
          doc.roundedRect(boxX, boxY, boxSize, boxSize, 1.5, 1.5, "FD");
          doc.setDrawColor(...GOLD_SOFT);
          doc.setLineWidth(1.3);
          doc.line(boxX + 2, boxY + 5.5, boxX + 4.2, boxY + 7.8);
          doc.line(boxX + 4.2, boxY + 7.8, boxX + 8.2, boxY + 2.6);
        } else {
          doc.roundedRect(boxX, boxY, boxSize, boxSize, 1.5, 1.5, "S");
        }

        doc.setTextColor(...(done ? MUTED : INK));
        doc.text(lines, margin + 24, y);

        y += lines.length * 14;
        doc.setDrawColor(245, 235, 220);
        doc.setLineWidth(0.3);
        doc.line(margin + 24, y - 4, pageW - margin, y - 4);
        y += 4;
      });

      y += 14;
    });

    if (gi < grouped.length - 1) {
      ensureSpace(20);
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.4);
      doc.line(pageW / 2 - 30, y, pageW / 2 + 30, y);
      y += 24;
    }
  });

  // Pró-Labore receipt
  const proLaboreKey = "m-financeiro:Definir Pró-Labore";
  const proLabore = state.extras[proLaboreKey];
  if (proLabore && (proLabore.amount || proLabore.notes)) {
    newPage();
    y = topY;

    doc.setFont("Lora", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text("RECIBO", margin, y, { charSpace: 2.5 });
    doc.setFont("Lora", "italic");
    doc.setFontSize(22);
    doc.setTextColor(...WINE_DEEP);
    doc.text("Definir Pró-Labore", margin, y + 22);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 32, margin + 60, y + 32);
    y += 60;

    const cardX = margin;
    const cardW = contentW;
    const amountRaw = (proLabore.amount ?? "").trim();
    const notesRaw = stripEmoji((proLabore.notes ?? "").trim());
    const notesLines = notesRaw ? doc.splitTextToSize(notesRaw, cardW - 32) : [];
    const cardH = 90 + (notesLines.length ? 24 + notesLines.length * 13 : 0);

    doc.setFillColor(...CREAM);
    doc.roundedRect(cardX, y, cardW, cardH, 4, 4, "F");
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, y, cardW, cardH, 4, 4, "S");
    doc.setFillColor(...GOLD);
    doc.rect(cardX, y, 4, cardH, "F");

    doc.setFont("Lora", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(`Emitido em ${today.toLocaleDateString("pt-BR")}`, cardX + cardW - 16, y + 22, { align: "right", charSpace: 1 });

    doc.setFontSize(9);
    doc.text("VALOR DO PRÓ-LABORE", cardX + 16, y + 24, { charSpace: 1.8 });

    doc.setFont("Lora", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...WINE_DEEP);
    const amountDisplay = amountRaw
      ? (amountRaw.startsWith("R$") ? amountRaw : `R$ ${amountRaw}`)
      : "—";
    doc.text(amountDisplay, cardX + 16, y + 56);

    doc.setDrawColor(...GOLD_SOFT);
    doc.setLineWidth(0.3);
    doc.line(cardX + 16, y + 72, cardX + cardW - 16, y + 72);

    if (notesLines.length) {
      doc.setFont("Lora", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("OBSERVAÇÕES", cardX + 16, y + 90, { charSpace: 1.8 });
      doc.setFont("Lora", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text(notesLines, cardX + 16, y + 106);
    } else {
      doc.setFont("Lora", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text("Sem observações registradas.", cardX + 16, y + 88);
    }

    y += cardH + 24;

    ensureSpace(40);
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 90, y + 12, pageW / 2 + 90, y + 12);
    doc.setFont("Lora", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Assinatura da confeiteira", pageW / 2, y + 26, { align: "center" });
  }

  ensureSpace(60);
  y += 10;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont("Lora", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...WINE);
  doc.text("Clareza também gera lucro.", pageW / 2, y, { align: "center" });

  doc.save(`organizacao-doce-${today.toISOString().slice(0, 10)}.pdf`);
  return true;
}
