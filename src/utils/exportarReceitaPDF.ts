import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

// Paleta Umbrella Doce
const COR_PRETO: [number, number, number] = [28, 28, 28];
const COR_CLOUD: [number, number, number] = [245, 244, 241];
const COR_PISTACHE: [number, number, number] = [191, 207, 184];
const COR_DOURADO: [number, number, number] = [198, 168, 90];
const COR_CINZA_TEXTO: [number, number, number] = [90, 90, 90];

const formatarPreco = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function carregarImagemComoDataURL(
  urlOuPath: string,
): Promise<{ dataUrl: string; format: "JPEG" | "PNG"; w: number; h: number } | null> {
  try {
    let url = urlOuPath;
    if (urlOuPath.startsWith("data:")) {
      url = urlOuPath;
    } else if (!/^https?:\/\//i.test(urlOuPath)) {
      const { data } = supabase.storage.from("receitas").getPublicUrl(urlOuPath);
      url = data.publicUrl;
    }

    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const dims: { w: number; h: number } = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = dataUrl;
    });

    const format: "JPEG" | "PNG" = blob.type.includes("png") ? "PNG" : "JPEG";
    return { dataUrl, format, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

export async function exportarReceitaPDF(receitaId: string) {
  const { data: receita, error } = await supabase
    .from("receitas")
    .select("*")
    .eq("id", receitaId)
    .single();

  if (error || !receita) {
    throw new Error(error?.message || "Receita não encontrada");
  }

  const [ingRes, embRes, despRes, imgRes, moRes] = await Promise.all([
    supabase
      .from("receitas_ingredientes")
      .select("*")
      .eq("receita_id", receitaId),
    supabase
      .from("receitas_embalagens")
      .select("*")
      .eq("receita_id", receitaId),
    supabase
      .from("receitas_despesas_venda")
      .select("*")
      .eq("receita_id", receitaId),
    supabase
      .from("receitas_imagens")
      .select("*")
      .eq("receita_id", receitaId)
      .order("ordem"),
    supabase
      .from("receitas_mao_obra")
      .select(`*, perfil:mao_obra_perfis ( nome, valor_hora )`)
      .eq("receita_id", receitaId),
  ]);

  const ingredientes = ingRes.data || [];
  const embalagens = embRes.data || [];
  const despesas = despRes.data || [];
  const imagens = imgRes.data || [];
  const maosObra = moRes.data || [];

  const { data: perfilPadrao } = await supabase
    .from("mao_obra_perfis")
    .select("nome, valor_hora")
    .eq("padrao", true)
    .eq("ativo", true)
    .maybeSingle();

  const custoIngredientes = ingredientes.reduce(
    (s, i: any) => s + Number(i.custo_receita || 0),
    0,
  );
  const custoEmbalagens = embalagens.reduce(
    (s, e: any) => s + Number(e.custo_receita || 0),
    0,
  );

  const linhasMaoObra = maosObra.map((mo: any) => {
    const valorHora = mo.usar_valor_padrao
      ? perfilPadrao?.valor_hora || 0
      : mo.perfil?.valor_hora || 0;
    const nomePerfil = mo.usar_valor_padrao
      ? `${perfilPadrao?.nome || "Padrão"} (padrão)`
      : mo.perfil?.nome || "—";
    return {
      nome: nomePerfil,
      horas: Number(mo.horas || 0),
      valorHora: Number(valorHora),
      total: Number(valorHora) * Number(mo.horas || 0),
    };
  });
  const custoMaoObra = linhasMaoObra.reduce((s, l) => s + l.total, 0);

  const custoProducao =
    Number(receita.custo_total ?? custoIngredientes + custoEmbalagens + custoMaoObra);
  const valorVenda = Number(receita.valor_venda || 0);
  const totalDespesasVenda = despesas.reduce(
    (s, d: any) => s + Number(d.valor || 0),
    0,
  );
  const lucro = valorVenda - custoProducao - totalDespesasVenda;
  const margemPct = valorVenda > 0 ? (lucro / valorVenda) * 100 : 0;

  // Carregar imagens
  const imagensPaths = imagens
    .map((i: any) => i.url)
    .filter((u: string) => !!u);
  const imagensCarregadas = (
    await Promise.all(imagensPaths.map((p: string) => carregarImagemComoDataURL(p)))
  ).filter((i): i is NonNullable<typeof i> => !!i);

  // ===== PDF =====
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let y = 0;

  // Faixa superior
  doc.setFillColor(...COR_PISTACHE);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setFillColor(...COR_DOURADO);
  doc.rect(0, 18, pageW, 0.6, "F");

  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Ficha Técnica", marginX, 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_CINZA_TEXTO);
  const dataGer = new Date().toLocaleDateString("pt-BR");
  doc.text(`Emitido em ${dataGer}`, pageW - marginX, 11.5, { align: "right" });

  y = 24;

  // Imagens lado a lado a partir do canto superior esquerdo
  if (imagensCarregadas.length > 0) {
    const imgsRender = imagensCarregadas.slice(0, 4);
    const gap = 3;
    const larguraDisponivel = pageW - marginX * 2;
    const qtd = imgsRender.length;
    const larguraCada = (larguraDisponivel - gap * (qtd - 1)) / qtd;
    const alturaMax = 42;
    let xCursor = marginX;
    let maiorAltura = 0;

    for (const img of imgsRender) {
      const ratio = img.w / img.h;
      let drawW = larguraCada;
      let drawH = drawW / ratio;
      if (drawH > alturaMax) {
        drawH = alturaMax;
        drawW = drawH * ratio;
      }
      const xCentered = xCursor + (larguraCada - drawW) / 2;
      try {
        doc.addImage(img.dataUrl, img.format, xCentered, y, drawW, drawH);
      } catch {
        /* ignore */
      }
      maiorAltura = Math.max(maiorAltura, drawH);
      xCursor += larguraCada + gap;
    }
    y += maiorAltura + 4;
  }

  // Nome + categoria
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const nomeLinhas = doc.splitTextToSize(receita.nome || "—", pageW - marginX * 2);
  doc.text(nomeLinhas, marginX, y);
  y += nomeLinhas.length * 6;

  if (receita.categoria) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text(receita.categoria, marginX, y + 1);
    y += 5;
  }
  y += 2;

  // Linha
  doc.setDrawColor(...COR_PISTACHE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);
  y += 5;

  // Meta (4 colunas: tempo, rendimento, valor venda, custo produção)
  const metaRender = (label: string, valor: string, x: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    doc.text(valor, x, y + 4);
  };

  const colW = (pageW - marginX * 2) / 4;
  const tempo = receita.tempo_preparo
    ? `${receita.tempo_preparo} ${receita.unidade_tempo || ""}`.trim()
    : "—";
  const rendimento = receita.rendimento
    ? `${Number(receita.rendimento).toLocaleString("pt-BR")} ${receita.unidade_rendimento || ""}`.trim()
    : "—";
  metaRender("Tempo de Preparo", tempo, marginX);
  metaRender("Rendimento", rendimento, marginX + colW);
  metaRender("Valor de Venda", formatarPreco(valorVenda), marginX + colW * 2);
  metaRender("Custo Produção", formatarPreco(custoProducao), marginX + colW * 3);
  y += 9;

  doc.setDrawColor(...COR_PISTACHE);
  doc.line(marginX, y, pageW - marginX, y);
  y += 5;

  // Estilos comuns das tabelas
  const styleBase = {
    font: "helvetica",
    fontSize: 8,
    textColor: COR_PRETO,
    cellPadding: { top: 1.4, bottom: 1.4, left: 2, right: 2 },
    lineColor: COR_PISTACHE,
    lineWidth: 0.1,
  } as const;
  const headBase = {
    fillColor: COR_CLOUD,
    textColor: COR_PRETO,
    fontStyle: "bold" as const,
    fontSize: 8,
    lineWidth: { bottom: 0.4 },
    lineColor: COR_DOURADO,
  };

  // Ingredientes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COR_PRETO);
  doc.text("Ingredientes", marginX, y);

  if (ingredientes.length > 0) {
    autoTable(doc, {
      startY: y + 2,
      head: [["Ingrediente", "Quantidade", "Custo"]],
      body: ingredientes.map((i: any) => [
        i.ingrediente || "—",
        `${Number(i.quantidade_utilizada || 0).toLocaleString("pt-BR")}`,
        formatarPreco(Number(i.custo_receita || 0)),
      ]),
      theme: "plain",
      margin: { left: marginX, right: marginX },
      styles: styleBase,
      headStyles: headBase,
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 32, halign: "right" },
        2: { cellWidth: 28, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 2;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text("Nenhum ingrediente.", marginX, y + 5);
    y += 8;
  }

  // Embalagens
  if (embalagens.length > 0) {
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    doc.text("Embalagens", marginX, y);

    autoTable(doc, {
      startY: y + 2,
      head: [["Embalagem", "Quantidade", "Custo"]],
      body: embalagens.map((e: any) => [
        e.ingrediente || "—",
        `${Number(e.quantidade_utilizada || 0).toLocaleString("pt-BR")}`,
        formatarPreco(Number(e.custo_receita || 0)),
      ]),
      theme: "plain",
      margin: { left: marginX, right: marginX },
      styles: styleBase,
      headStyles: headBase,
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 32, halign: "right" },
        2: { cellWidth: 28, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 2;
  }

  // Mão de Obra
  if (linhasMaoObra.length > 0) {
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    doc.text("Mão de Obra", marginX, y);

    autoTable(doc, {
      startY: y + 2,
      head: [["Perfil", "Horas", "Valor/Hora", "Total"]],
      body: linhasMaoObra.map((l) => [
        l.nome,
        l.horas.toLocaleString("pt-BR"),
        formatarPreco(l.valorHora),
        formatarPreco(l.total),
      ]),
      theme: "plain",
      margin: { left: marginX, right: marginX },
      styles: styleBase,
      headStyles: headBase,
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 20, halign: "right" },
        2: { cellWidth: 28, halign: "right" },
        3: { cellWidth: 28, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 2;
  }

  // Despesas de Venda
  if (despesas.length > 0) {
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    doc.text("Custos com Vendas", marginX, y);

    autoTable(doc, {
      startY: y + 2,
      head: [["Descrição", "%", "Valor"]],
      body: despesas.map((d: any) => [
        d.nome || "—",
        `${Number(d.percentual || 0).toLocaleString("pt-BR")}%`,
        formatarPreco(Number(d.valor || 0)),
      ]),
      theme: "plain",
      margin: { left: marginX, right: marginX },
      styles: styleBase,
      headStyles: headBase,
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 24, halign: "right" },
        2: { cellWidth: 28, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 2;
  }

  // Resumo
  y += 2;
  doc.setDrawColor(...COR_DOURADO);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageW - marginX, y);
  y += 4;

  const linhaResumo = (label: string, valor: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9.5 : 8.5);
    doc.setTextColor(...COR_PRETO);
    doc.text(label, marginX, y);
    doc.text(valor, pageW - marginX, y, { align: "right" });
    y += bold ? 5 : 4.2;
  };

  linhaResumo("Custo de produção", formatarPreco(custoProducao));
  if (totalDespesasVenda > 0) {
    linhaResumo("Custos com vendas", formatarPreco(totalDespesasVenda));
  }
  linhaResumo("Valor de venda", formatarPreco(valorVenda), true);
  linhaResumo(
    `Lucro (${margemPct.toFixed(1)}%)`,
    formatarPreco(lucro),
    true,
  );

  // Modo de preparo
  if (receita.modo_preparo && String(receita.modo_preparo).trim()) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    doc.text("Modo de Preparo", marginX, y);
    y += 4;

    const espacoDisponivel = pageH - 14 - y;
    let fontSize = 9;
    let lineHeight = 4.2;
    let linhas: string[] = [];

    while (fontSize >= 6.5) {
      doc.setFontSize(fontSize);
      linhas = doc.splitTextToSize(receita.modo_preparo, pageW - marginX * 2);
      const alturaTotal = linhas.length * lineHeight;
      if (alturaTotal <= espacoDisponivel) break;
      fontSize -= 0.5;
      lineHeight = fontSize * 0.46;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...COR_PRETO);

    const maxLinhas = Math.floor((pageH - 14 - y) / lineHeight);
    const linhasExibir = linhas.slice(0, Math.max(1, maxLinhas));
    if (linhas.length > linhasExibir.length && linhasExibir.length > 0) {
      linhasExibir[linhasExibir.length - 1] =
        linhasExibir[linhasExibir.length - 1].replace(/\s*\S*$/, "") + "…";
    }
    for (const linha of linhasExibir) {
      doc.text(linha, marginX, y);
      y += lineHeight;
    }
  }

  // Rodapé
  doc.setDrawColor(...COR_PISTACHE);
  doc.setLineWidth(0.2);
  doc.line(marginX, pageH - 10, pageW - marginX, pageH - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_CINZA_TEXTO);
  doc.text("Caixa de Açúcar — Ficha Técnica", marginX, pageH - 5);
  doc.text("Página 1 de 1", pageW - marginX, pageH - 5, { align: "right" });

  const slug = (receita.nome || "ficha-tecnica")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  doc.save(`${slug || "ficha-tecnica"}.pdf`);
}
