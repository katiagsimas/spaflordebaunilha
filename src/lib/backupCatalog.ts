// Catálogo central de tabelas agrupadas por módulo para Backup/Restore.
// IDs de módulo são persistidos em backup_agendamentos.modulos e backups.modulos.

export type BackupModuloId =
  | "operacao"
  | "comercial"
  | "negocio"
  | "sistema";

export interface BackupModuloDef {
  id: BackupModuloId;
  titulo: string;
  descricao: string;
  tabelas: string[];
}

export const BACKUP_MODULOS: BackupModuloDef[] = [
  {
    id: "operacao",
    titulo: "Minha Operação",
    descricao: "Receitas, ingredientes, embalagens, estoque e pré-preparos",
    tabelas: [
      "categorias",
      "ingredientes",
      "embalagens",
      "receitas",
      "receitas_ingredientes",
      "receitas_embalagens",
      "receitas_mao_obra",
      "receitas_despesas_venda",
      "receitas_imagens",
      "pre_preparos",
      "pre_preparos_ingredientes",
      "pre_preparos_mao_obra",
      "estoque",
      "estoque_movimentacoes",
      "unidades_medida",
      "tipos_insumos",
      "mao_obra_perfis",
      "mao_obra_perfis_historico",
    ],
  },
  {
    id: "comercial",
    titulo: "Meu Comercial",
    descricao: "Clientes, fornecedores, propostas, contratos e encomendas",
    tabelas: [
      "clientes",
      "cliente_familiares",
      "fornecedores",
      "fornecedor_contatos",
      "propostas",
      "contratos",
      "contratos_templates",
      "encomendas",
      "encomenda_itens",
      "encomendas_tags",
      "tags_encomendas",
    ],
  },
  {
    id: "negocio",
    titulo: "Meu Negócio",
    descricao: "Financeiro, contas, custos fixos e fechamentos",
    tabelas: [
      "bancos",
      "saldos_iniciais_bancos",
      "transferencias_bancos",
      "plano_contas",
      "categorias_plano_contas",
      "tipos_documento",
      "contas_receber",
      "contas_receber_parcelas",
      "contas_receber_pagamentos",
      "contas_receber_comprovantes",
      "contas_pagar",
      "contas_pagar_parcelas",
      "contas_pagar_pagamentos",
      "contas_pagar_comprovantes",
      "custos_fixos",
      "configuracoes_juros",
      "meu_salario_retiradas",
      "fechamentos_mensais",
      "fechamento_logs",
      "fechamento_checklist_itens",
    ],
  },
  {
    id: "sistema",
    titulo: "Sistema",
    descricao: "Preferências, tags e favoritos da Conversa Doce",
    tabelas: [
      "tags",
      "conversa_doce_favoritos",
    ],
  },
];

export const DEFAULT_MODULOS: BackupModuloId[] = BACKUP_MODULOS.map((m) => m.id);

export function tabelasDosModulos(modulos: BackupModuloId[]): string[] {
  const set = new Set<string>();
  for (const m of BACKUP_MODULOS) {
    if (modulos.includes(m.id)) m.tabelas.forEach((t) => set.add(t));
  }
  return [...set];
}
