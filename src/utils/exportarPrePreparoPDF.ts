import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

// Paleta Umbrella Doce (RGB)
const COR_PRETO: [number, number, number] = [28, 28, 28];
const COR_CLOUD: [number, number, number] = [245, 244, 241];
const COR_PISTACHE: [number, number, number] = [191, 207, 184];
const COR_DOURADO: [number, number, number] = [198, 168, 90];
const COR_CINZA_TEXTO: [number, number, number] = [90, 90, 90];

const formatarPreco = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Resolve uma URL/caminho de imagem para dataURL (base64), de modo
 * que o jsPDF possa embutir mesmo quando a origem é o Supabase Storage.
 */
async function carregarImagemComoDataURL(
  urlOuPath: string,
): Promise<{ dataUrl: string; format: "JPEG" | "PNG"; w: number; h: number } | null> {
  try {
    let url = urlOuPath;
    // Se não for URL absoluta, tenta gerar URL pública/assinada do bucket "pre-preparos"
    if (!/^https?:\/\//i.test(urlOuPath)) {
      const { data } = supabase.storage
        .from("pre-preparos")
        .getPublicUrl(urlOuPath);
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

/**
 * Carrega os dados completos do pré-preparo e gera um PDF A4 retrato minimalista,
 * compactado em uma única página, com imagens (quando existentes).
 */
export async function exportarPrePreparoPDF(prePreparoId: string) {
  const { data: preparo, error } = await supabase
    .from("pre_preparos")
    .select(
      `
      *,
      rendimento_unidade:unidades_medida!rendimento_unidade_id ( nome, sigla ),
      categoria:categorias ( nome ),
      ingredientes:pre_preparos_ingredientes (
        quantidade_utilizada,
        custo_ingrediente,
        ordem,
        ingrediente:ingredientes (
          marca,
          preco,
          tipo_insumo:tipos_insumos (
            descricao,
            quantidade_embalagem,
            unidade_medida:unidades_medida ( sigla )
          )
        )
      )
    `,
    )
    .eq("id", prePreparoId)
    .single();

  if (error || !preparo) {
    throw new Error(error?.message || "Pré-preparo não encontrado");
  }

  const { data: maosObra } = await supabase
    .from("pre_preparos_mao_obra")
    .select(`*, perfil:mao_obra_perfis ( nome, valor_hora )`)
    .eq("pre_preparo_id", prePreparoId);

  const { data: perfilPadrao } = await supabase
    .from("mao_obra_perfis")
    .select("nome, valor_hora")
    .eq("padrao", true)
    .eq("ativo", true)
    .maybeSingle();

  const ingredientes = (preparo.ingredientes || []).sort(
    (a: any, b: any) => (a.ordem || 0) - (b.ordem || 0),
  );

  const custoIngredientes = ingredientes.reduce(
    (s: number, i: any) => s + Number(i.custo_ingrediente || 0),
    0,
  );

  const linhasMaoObra = (maosObra || []).map((mo: any) => {
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
  const custoTotal = custoIngredientes + custoMaoObra;
  const rendimento = Number(preparo.rendimento_quantidade || 1);
  const custoPorUnidade = rendimento > 0 ? custoTotal / rendimento : 0;
  const siglaRend =
    (preparo as any).rendimento_unidade?.sigla ||
    (preparo as any).rendimento_unidade?.nome ||
    "";

  // Carregar imagens do pré-preparo (até 2)
  const imagensPaths = [
    (preparo as any).imagem_1_url,
    (preparo as any).imagem_2_url,
  ].filter((p): p is string => !!p && typeof p === "string");

  const imagensCarregadas = (
    await Promise.all(imagensPaths.map((p) => carregarImagemComoDataURL(p)))
  ).filter((i): i is NonNullable<typeof i> => !!i);

  // ===== Construir PDF =====
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth(); // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297
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
  doc.text("Ficha de Pré-Preparo", marginX, 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_CINZA_TEXTO);
  const dataGer = new Date().toLocaleDateString("pt-BR");
  doc.text(`Emitido em ${dataGer}`, pageW - marginX, 11.5, { align: "right" });

  y = 24;

  // Imagens lado a lado, a partir do canto superior esquerdo
  const temImagens = imagensCarregadas.length > 0;
  let yAposImagens = y;
  if (temImagens) {
    const gap = 3;
    const larguraDisponivel = pageW - marginX * 2;
    const qtd = imagensCarregadas.length;
    const larguraCada = (larguraDisponivel - gap * (qtd - 1)) / qtd;
    const alturaMax = 42;
    let xCursor = marginX;
    let maiorAltura = 0;

    for (const img of imagensCarregadas) {
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
        /* silencia falha de imagem isolada */
      }
      maiorAltura = Math.max(maiorAltura, drawH);
      xCursor += larguraCada + gap;
    }
    yAposImagens = y + maiorAltura + 4;
  }

  y = yAposImagens;

  // Nome (largura total) e categoria abaixo das imagens
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const nomeLinhas = doc.splitTextToSize(preparo.nome || "—", pageW - marginX * 2);
  doc.text(nomeLinhas, marginX, y);
  y += nomeLinhas.length * 6;

  const nomeCategoria = (preparo as any).categoria?.nome;
  if (nomeCategoria) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text(nomeCategoria, marginX, y + 1);
    y += 5;
  }

  y += 2;

  // Linha divisória
  doc.setDrawColor(...COR_PISTACHE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);
  y += 5;

  // Meta informações em 3 colunas compactas
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

  const colW = (pageW - marginX * 2) / 3;
  metaRender(
    "Tempo de Preparo",
    `${preparo.tempo_preparo} ${preparo.tempo_preparo_unidade}`,
    marginX,
  );
  metaRender(
    "Rendimento",
    `${rendimento.toLocaleString("pt-BR")} ${siglaRend}`,
    marginX + colW,
  );
  metaRender("Custo Total", formatarPreco(custoTotal), marginX + colW * 2);
  y += 10;

  doc.setDrawColor(...COR_PISTACHE);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  // ===== Tabela de Ingredientes =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COR_PRETO);
  doc.text("Ingredientes", marginX, y);

  const linhasIng = ingredientes.map((item: any) => {
    const ti = item.ingrediente?.tipo_insumo;
    const nome = ti?.descricao || "—";
    const marca = item.ingrediente?.marca || "";
    const sigla = ti?.unidade_medida?.sigla || "";
    return [
      marca ? `${nome} — ${marca}` : nome,
      `${Number(item.quantidade_utilizada || 0).toLocaleString("pt-BR")} ${sigla}`,
      formatarPreco(Number(item.custo_ingrediente || 0)),
    ];
  });

  if (linhasIng.length > 0) {
    autoTable(doc, {
      startY: y + 2,
      head: [["Ingrediente", "Quantidade", "Custo"]],
      body: linhasIng,
      theme: "plain",
      margin: { left: marginX, right: marginX },
      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: COR_PRETO,
        cellPadding: { top: 1.4, bottom: 1.4, left: 2, right: 2 },
        lineColor: COR_PISTACHE,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COR_CLOUD,
        textColor: COR_PRETO,
        fontStyle: "bold",
        fontSize: 8,
        lineWidth: { bottom: 0.4 },
        lineColor: COR_DOURADO,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 32, halign: "right" },
        2: { cellWidth: 28, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text("Nenhum ingrediente cadastrado.", marginX, y + 5);
    y += 14;
  }

  // ===== Mão de Obra =====
  if (linhasMaoObra.length > 0) {
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
      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: COR_PRETO,
        cellPadding: { top: 1.4, bottom: 1.4, left: 2, right: 2 },
        lineColor: COR_PISTACHE,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COR_CLOUD,
        textColor: COR_PRETO,
        fontStyle: "bold",
        fontSize: 8,
        lineWidth: { bottom: 0.4 },
        lineColor: COR_DOURADO,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 20, halign: "right" },
        2: { cellWidth: 28, halign: "right" },
        3: { cellWidth: 28, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Card de Resumo de Custos (borda dourada) =====
  const linhasCard: { label: string; valor: string; bold?: boolean }[] = [
    { label: "Custo de ingredientes", valor: formatarPreco(custoIngredientes) },
  ];
  if (custoMaoObra > 0) {
    linhasCard.push({
      label: "Custo de mão de obra",
      valor: formatarPreco(custoMaoObra),
    });
  }
  linhasCard.push({ label: "Custo total", valor: formatarPreco(custoTotal), bold: true });
  linhasCard.push({
    label: `Custo por ${siglaRend || "unidade"}`,
    valor: formatarPreco(custoPorUnidade),
    bold: true,
  });

  const cardPad = 4;
  const lineH = 5.2;
  const cardH = cardPad * 2 + linhasCard.length * lineH + 2;
  const cardY = y;

  doc.setFillColor(...COR_CLOUD);
  doc.roundedRect(marginX, cardY, pageW - marginX * 2, cardH, 2, 2, "F");
  doc.setDrawColor(...COR_DOURADO);
  doc.setLineWidth(0.6);
  doc.roundedRect(marginX, cardY, pageW - marginX * 2, cardH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COR_DOURADO);
  doc.text("RESUMO DE CUSTOS", marginX + cardPad, cardY + cardPad + 1);

  let yCard = cardY + cardPad + 6;
  for (const l of linhasCard) {
    doc.setFont("helvetica", l.bold ? "bold" : "normal");
    doc.setFontSize(l.bold ? 10 : 9);
    doc.setTextColor(...COR_PRETO);
    doc.text(l.label, marginX + cardPad, yCard);
    doc.text(l.valor, pageW - marginX - cardPad, yCard, { align: "right" });
    yCard += lineH;
  }
  y = cardY + cardH + 6;

  // ===== Modo de Preparo (compacto, ajusta fonte para caber na página) =====
  if (preparo.modo_preparo && preparo.modo_preparo.trim()) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    doc.text("Modo de Preparo", marginX, y);
    y += 4;

    // Espaço disponível até o rodapé (rodapé fica em pageH - 12)
    const espacoDisponivel = pageH - 14 - y;
    let fontSize = 9;
    let lineHeight = 4.2;
    let linhas: string[] = [];

    // Reduz fonte progressivamente até caber
    while (fontSize >= 6.5) {
      doc.setFontSize(fontSize);
      linhas = doc.splitTextToSize(preparo.modo_preparo, pageW - marginX * 2);
      const alturaTotal = linhas.length * lineHeight;
      if (alturaTotal <= espacoDisponivel) break;
      fontSize -= 0.5;
      lineHeight = fontSize * 0.46;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...COR_PRETO);

    // Trunca se ainda assim ultrapassar
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

  // ===== Rodapé =====
  doc.setDrawColor(...COR_PISTACHE);
  doc.setLineWidth(0.2);
  doc.line(marginX, pageH - 10, pageW - marginX, pageH - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_CINZA_TEXTO);
  doc.text("Caixa de Açúcar by Umbrella Doce", marginX, pageH - 5);
  doc.text("Página 1 de 1", pageW - marginX, pageH - 5, { align: "right" });

  const slug = (preparo.nome || "pre-preparo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  doc.save(`${slug || "pre-preparo"}.pdf`);
}
