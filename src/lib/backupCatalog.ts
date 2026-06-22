// Catálogo central de tabelas agrupadas por módulo para Backup/Restore.
// IDs de módulo são persistidos em backup_agendamentos.modulos e backups.modulos.

export type BackupModuloId =
  | "operacao"
  | "comercial"
  | "negocio"
  | "sistema"
  | "governanca";

export interface BackupModuloDef {
  id: BackupModuloId;
  titulo: string;
  descricao: string;
  tabelas: string[];
  /** Visível e executável apenas para o usuário MOTHER. */
  motherOnly?: boolean;
}

export const BACKUP_MODULOS: BackupModuloDef[] = [
  {
    id: "operacao",
    titulo: "Minha Produção",
    descricao: "Cadastros, Cardápio, Estoque e Fichas Técnicas",
    tabelas: [
      // Cadastros
      "categorias",
      "ingredientes",
      "embalagens",
      "tipos_insumos",
      "unidades_medida",
      "mao_obra_perfis",
      "mao_obra_perfis_historico",
      // Cardápio
      "receitas",
      "receitas_ingredientes",
      "receitas_embalagens",
      "receitas_mao_obra",
      "receitas_despesas_venda",
      "receitas_imagens",
      "pre_preparos",
      "pre_preparos_ingredientes",
      "pre_preparos_mao_obra",
      // Estoque
      "estoque",
      "estoque_movimentacoes",
    ],
  },
  {
    id: "comercial",
    titulo: "Meu Comercial",
    descricao: "Clientes, fornecedores, propostas, contratos, encomendas e tags de encomendas",
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
      "tags",
    ],
  },
  {
    id: "negocio",
    titulo: "Meu Negócio",
    descricao: "Meu Dinheiro, fechamentos, Conversa Doce e Meu Salário",
    tabelas: [
      // Meu Dinheiro
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
      // Fechamentos
      "fechamentos_mensais",
      "fechamento_logs",
      "fechamento_checklist_itens",
      // Meu Salário
      "meu_salario_retiradas",
      // Conversa Doce
      "conversa_doce_favoritos",
    ],
  },
  {
    id: "sistema",
    titulo: "Sistema",
    descricao: "Meus Dados (perfil da confeitaria)",
    tabelas: [
      "profiles",
    ],
  },
  {
    id: "governanca",
    titulo: "Governança / Usuários",
    descricao: "Grupos, papéis globais e por grupo, perfis e histórico de planos (apenas MOTHER)",
    motherOnly: true,
    tabelas: [
      "groups",
      "user_global_roles",
      "user_group_roles",
      "user_roles",
      "profiles",
      "historico_planos",
    ],
  },
];

/** Módulos padrão (não inclui `motherOnly`); use `modulosDisponiveis(isMother)` para a lista visível. */
export const DEFAULT_MODULOS: BackupModuloId[] = BACKUP_MODULOS
  .filter((m) => !m.motherOnly)
  .map((m) => m.id);

export function modulosDisponiveis(isMother: boolean): BackupModuloDef[] {
  return BACKUP_MODULOS.filter((m) => !m.motherOnly || isMother);
}

export function tabelasDosModulos(modulos: BackupModuloId[]): string[] {
  const set = new Set<string>();
  for (const m of BACKUP_MODULOS) {
    if (modulos.includes(m.id)) m.tabelas.forEach((t) => set.add(t));
  }
  return [...set];
}
