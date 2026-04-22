import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

// Paleta Umbrella Doce (RGB)
const COR_PRETO: [number, number, number] = [28, 28, 28];
const COR_CLOUD: [number, number, number] = [245, 244, 241];
const COR_PISTACHE: [number, number, number] = [191, 207, 184];
const COR_DOURADO: [number, number, number] = [198, 168, 90];
const COR_CINZA_TEXTO: [number, number, number] = [90, 90, 90];

interface PrePreparoData {
  id: string;
  nome: string;
  tempo_preparo: number;
  tempo_preparo_unidade: string;
  rendimento_quantidade: number;
  rendimento_unidade?: { nome?: string; sigla?: string } | null;
  rendimento_unidade_id?: string;
  custo_total?: number | null;
  custo_por_unidade?: number | null;
  modo_preparo?: string | null;
  categoria_id?: string | null;
}

const formatarPreco = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Carrega os dados completos do pré-preparo e gera um PDF A4 retrato minimalista.
 */
export async function exportarPrePreparoPDF(prePreparoId: string) {
  // Buscar pré-preparo + ingredientes + unidade
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

  // Mão de obra
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

  // ===== Construir PDF =====
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth(); // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297
  const marginX = 16;
  let y = 0;

  // Faixa superior pistache fina + título
  doc.setFillColor(...COR_PISTACHE);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFillColor(...COR_DOURADO);
  doc.rect(0, 22, pageW, 0.8, "F");

  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Ficha de Pré-Preparo", marginX, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COR_CINZA_TEXTO);
  const dataGer = new Date().toLocaleDateString("pt-BR");
  doc.text(`Emitido em ${dataGer}`, pageW - marginX, 14, { align: "right" });

  y = 32;

  // Nome do pré-preparo
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(preparo.nome || "—", marginX, y);
  y += 7;

  // Categoria (se houver)
  const nomeCategoria = (preparo as any).categoria?.nome;
  if (nomeCategoria) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text(nomeCategoria, marginX, y);
    y += 6;
  }

  y += 2;

  // Bloco de meta-informações (linhas leves)
  doc.setDrawColor(...COR_PISTACHE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  const metaRender = (label: string, valor: string, x: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COR_PRETO);
    doc.text(valor, x, y + 5);
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
  y += 11;

  doc.setDrawColor(...COR_PISTACHE);
  doc.line(marginX, y, pageW - marginX, y);
  y += 8;

  // ===== Tabela de Ingredientes =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COR_PRETO);
  doc.text("Ingredientes", marginX, y);
  y += 3;

  const linhasIng = ingredientes.map((item: any) => {
    const ti = item.ingrediente?.tipo_insumo;
    const nome = ti?.descricao || "—";
    const marca = item.ingrediente?.marca || "";
    const sigla = ti?.unidade_medida?.sigla || "";
    return [
      marca ? `${nome}\n${marca}` : nome,
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
        fontSize: 9,
        textColor: COR_PRETO,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        lineColor: COR_PISTACHE,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COR_CLOUD,
        textColor: COR_PRETO,
        fontStyle: "bold",
        lineWidth: { bottom: 0.4 },
        lineColor: COR_DOURADO,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 38, halign: "right" },
        2: { cellWidth: 32, halign: "right" },
      },
      didDrawPage: () => {},
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text("Nenhum ingrediente cadastrado.", marginX, y + 6);
    y += 10;
  }

  // ===== Mão de Obra =====
  if (linhasMaoObra.length > 0) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COR_PRETO);
    doc.text("Mão de Obra", marginX, y);

    autoTable(doc, {
      startY: y + 5,
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
        fontSize: 9,
        textColor: COR_PRETO,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        lineColor: COR_PISTACHE,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COR_CLOUD,
        textColor: COR_PRETO,
        fontStyle: "bold",
        lineWidth: { bottom: 0.4 },
        lineColor: COR_DOURADO,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 24, halign: "right" },
        2: { cellWidth: 32, halign: "right" },
        3: { cellWidth: 32, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  }

  // ===== Resumo de Custos =====
  y += 4;
  if (y > pageH - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(...COR_DOURADO);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  const linhaResumo = (label: string, valor: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(...COR_PRETO);
    doc.text(label, marginX, y);
    doc.text(valor, pageW - marginX, y, { align: "right" });
    y += bold ? 7 : 5.5;
  };

  linhaResumo("Custo de ingredientes", formatarPreco(custoIngredientes));
  if (custoMaoObra > 0) {
    linhaResumo("Custo de mão de obra", formatarPreco(custoMaoObra));
  }
  linhaResumo("Custo total", formatarPreco(custoTotal), true);
  linhaResumo(
    `Custo por ${siglaRend || "unidade"}`,
    formatarPreco(custoPorUnidade),
    true,
  );

  // ===== Modo de Preparo =====
  if (preparo.modo_preparo && preparo.modo_preparo.trim()) {
    y += 4;
    if (y > pageH - 50) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COR_PRETO);
    doc.text("Modo de Preparo", marginX, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COR_PRETO);
    const linhas = doc.splitTextToSize(
      preparo.modo_preparo,
      pageW - marginX * 2,
    );
    for (const linha of linhas) {
      if (y > pageH - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(linha, marginX, y);
      y += 5;
    }
  }

  // ===== Rodapé em todas as páginas =====
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COR_PISTACHE);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageH - 12, pageW - marginX, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COR_CINZA_TEXTO);
    doc.text("Caixa de Açúcar — Ficha de Pré-Preparo", marginX, pageH - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageW - marginX, pageH - 7, {
      align: "right",
    });
  }

  const slug = (preparo.nome || "pre-preparo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  doc.save(`${slug || "pre-preparo"}.pdf`);
}
