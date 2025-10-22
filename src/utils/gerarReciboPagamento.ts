import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DadosEmpresa {
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
}

interface DadosCliente {
  nome: string;
  cpf_cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
}

interface DadosPagamento {
  numero_recibo: string;
  data_pagamento: string;
  valor_pago: number;
  juros?: number;
  desconto?: number;
  valor_liquido: number;
  banco_nome: string;
  banco_codigo: string;
  tipo_documento: string;
  observacao?: string;
  referente: string;
}

export async function gerarReciboPagamento(
  dadosEmpresa: DadosEmpresa,
  dadosCliente: DadosCliente,
  dadosPagamento: DadosPagamento
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 20;

  // ==========================================
  // CABEÇALHO - LOGO E DADOS DA EMPRESA
  // ==========================================
  
  const startX = 15;
  const logoWidth = 35;
  const logoHeight = 35;
  const textStartX = dadosEmpresa.logo_url ? startX + logoWidth + 10 : startX;
  
  // Logo (se existir)
  if (dadosEmpresa.logo_url) {
    try {
      console.log('📷 Tentando carregar logo:', dadosEmpresa.logo_url);
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Permite carregar imagens de outros domínios
      img.src = dadosEmpresa.logo_url;
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('✅ Logo carregada com sucesso');
          resolve(true);
        };
        img.onerror = (error) => {
          console.error('❌ Erro ao carregar logo:', error);
          resolve(false); // Não bloqueia se falhar
        };
        // Timeout de 5 segundos
        setTimeout(() => {
          console.warn('⏱️ Timeout ao carregar logo');
          resolve(false);
        }, 5000);
      });
      
      // Tentar adicionar a imagem ao PDF
      try {
        doc.addImage(img, 'PNG', startX, yPos, logoWidth, logoHeight);
        console.log('✅ Logo adicionada ao PDF');
      } catch (e) {
        console.error('❌ Erro ao adicionar logo ao PDF:', e);
      }
    } catch (error) {
      console.error('❌ Erro geral ao processar logo:', error);
    }
  } else {
    console.log('ℹ️ Nenhuma logo fornecida');
  }

  // Nome da Empresa (Nome Fantasia ou Razão Social)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const nomeEmpresa = dadosEmpresa.nome_fantasia || dadosEmpresa.razao_social || 'Empresa';
  doc.text(nomeEmpresa, textStartX, yPos + 6);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let currentY = yPos + 12;
  
  // CNPJ
  if (dadosEmpresa.cnpj) {
    doc.text(`CNPJ: ${dadosEmpresa.cnpj}`, textStartX, currentY);
    currentY += 4;
  }
  
  // Endereço Completo
  if (dadosEmpresa.endereco || dadosEmpresa.cidade || dadosEmpresa.estado || dadosEmpresa.cep) {
    const partesEndereco = [
      dadosEmpresa.endereco,
      dadosEmpresa.cidade,
      dadosEmpresa.estado,
      dadosEmpresa.cep
    ].filter(Boolean);
    
    if (partesEndereco.length > 0) {
      const enderecoCompleto = partesEndereco.join(', ');
      // Quebrar endereço em múltiplas linhas se for muito longo
      const linhasEndereco = doc.splitTextToSize(enderecoCompleto, pageWidth - textStartX - 15);
      doc.text(linhasEndereco, textStartX, currentY);
      currentY += linhasEndereco.length * 4;
    }
  }
  
  // Telefone
  if (dadosEmpresa.telefone) {
    doc.text(`Tel: ${dadosEmpresa.telefone}`, textStartX, currentY);
    currentY += 4;
  }
  
  // Email
  if (dadosEmpresa.email) {
    doc.text(`Email: ${dadosEmpresa.email}`, textStartX, currentY);
    currentY += 4;
  }

  // Ajustar posição Y para o próximo bloco
  yPos = Math.max(currentY, yPos + logoHeight) + 8;

  // ==========================================
  // TÍTULO DO RECIBO
  // ==========================================
  // Usando a cor primary da paleta: hsl(14 48% 71%) = RGB(221, 162, 137)
  doc.setFillColor(221, 162, 137);
  doc.rect(0, yPos, pageWidth, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGAMENTO', pageWidth / 2, yPos + 8, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // ==========================================
  // NÚMERO DO RECIBO E DATA
  // ==========================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Recibo Nº: ${dadosPagamento.numero_recibo}`, 15, yPos);
  doc.text(`Data: ${dadosPagamento.data_pagamento}`, pageWidth - 15, yPos, { align: 'right' });
  
  yPos += 10;

  // ==========================================
  // DADOS DO CLIENTE
  // ==========================================
  // Usando a cor secondary da paleta: hsl(20 50% 93%) = RGB(247, 235, 230)
  doc.setFillColor(247, 235, 230);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEBEMOS DE:', 18, yPos + 5.5);
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text(`Nome: ${dadosCliente.nome}`, 18, yPos);
  yPos += 5;
  
  if (dadosCliente.cpf_cnpj) {
    doc.text(`CPF/CNPJ: ${dadosCliente.cpf_cnpj}`, 18, yPos);
    yPos += 5;
  }
  
  if (dadosCliente.endereco) {
    const enderecoCliente = [
      dadosCliente.endereco,
      dadosCliente.cidade,
      dadosCliente.estado
    ].filter(Boolean).join(', ');
    doc.text(`Endereço: ${enderecoCliente}`, 18, yPos);
    yPos += 5;
  }
  
  if (dadosCliente.telefone || dadosCliente.email) {
    const contatoCliente = [
      dadosCliente.telefone ? `Tel: ${dadosCliente.telefone}` : null,
      dadosCliente.email ? `Email: ${dadosCliente.email}` : null
    ].filter(Boolean).join(' | ');
    doc.text(contatoCliente, 18, yPos);
    yPos += 5;
  }

  yPos += 8;

  // ==========================================
  // REFERENTE A
  // ==========================================
  doc.setFillColor(247, 235, 230);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('REFERENTE A:', 18, yPos + 5.5);
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.text(dadosPagamento.referente, 18, yPos);
  
  yPos += 10;

  // ==========================================
  // DETALHAMENTO DO PAGAMENTO
  // ==========================================
  doc.setFillColor(247, 235, 230);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHAMENTO DO PAGAMENTO:', 18, yPos + 5.5);
  
  yPos += 12;

  // Tabela de valores
  const dadosTabela = [
    ['Descrição', 'Valor'],
    ['Valor Pago', `R$ ${dadosPagamento.valor_pago.toFixed(2).replace('.', ',')}`],
  ];

  if (dadosPagamento.juros && dadosPagamento.juros > 0) {
    dadosTabela.push(['(+) Juros por Atraso', `R$ ${dadosPagamento.juros.toFixed(2).replace('.', ',')}`]);
  }

  if (dadosPagamento.desconto && dadosPagamento.desconto > 0) {
    dadosTabela.push(['(-) Desconto Concedido', `R$ ${dadosPagamento.desconto.toFixed(2).replace('.', ',')}`]);
  }

  dadosTabela.push(['VALOR LÍQUIDO RECEBIDO', `R$ ${dadosPagamento.valor_liquido.toFixed(2).replace('.', ',')}`]);

  autoTable(doc, {
    startY: yPos,
    head: [dadosTabela[0]],
    body: dadosTabela.slice(1),
    margin: { left: 15, right: 15 },
    theme: 'grid',
    headStyles: {
      fillColor: [221, 162, 137], // primary
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'normal' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    bodyStyles: {
      fontSize: 10,
    },
    didParseCell: function(data: any) {
      if (data.row.index === data.table.body.length - 1) {
        data.cell.styles.fillColor = [240, 253, 244]; // success suave
        data.cell.styles.textColor = [22, 101, 52];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ==========================================
  // FORMA DE PAGAMENTO
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FORMA DE PAGAMENTO:', 18, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`${dadosPagamento.tipo_documento} - ${dadosPagamento.banco_codigo} ${dadosPagamento.banco_nome}`, 18, yPos);
  
  yPos += 10;

  // Observação (se houver)
  if (dadosPagamento.observacao) {
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', 18, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const linhasObs = doc.splitTextToSize(dadosPagamento.observacao, pageWidth - 40);
    doc.text(linhasObs, 18, yPos);
    yPos += linhasObs.length * 4 + 5;
  }

  // ==========================================
  // ASSINATURA E RODAPÉ
  // ==========================================
  yPos = pageHeight - 40;

  // Linha para assinatura
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Responsável', pageWidth / 2, yPos, { align: 'center' });
  
  // Rodapé
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Recibo gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // ==========================================
  // GERAR PDF
  // ==========================================
  const nomeArquivo = `Recibo_${dadosPagamento.numero_recibo}_${dadosCliente.nome.replace(/\s+/g, '_')}.pdf`;
  doc.save(nomeArquivo);
}

export function formatarValorPDF(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
