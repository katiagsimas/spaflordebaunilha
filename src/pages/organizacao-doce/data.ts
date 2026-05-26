import type { ReactNode } from "react";
import { createElement as h } from "react";

export type Block = {
  id: string;
  title: string;
  icon: ReactNode;
  items: string[];
};

export type Area = {
  id: "diaria" | "semanal" | "mensal";
  label: string;
  tagline: string;
  blocks: Block[];
};

export type ItemExtras = { amount?: string; notes?: string };

export type RitualState = {
  startDate: string | null;
  weekKey: string | null;
  done: Record<string, boolean>;
  closed: Record<string, boolean>;
  custom: Record<string, string[]>;
  extras: Record<string, ItemExtras>;
};

export const PHRASES: { text: string; author: string }[] = [
  { text: "Confeitaria que dá lucro não nasce do improviso, nasce do ritual.", author: "Ká Simas" },
  { text: "A empresária não espera o tempo sobrar — ela cria espaço para o que importa.", author: "Ká Simas" },
  { text: "Cada número que você conhece é uma decisão que você recupera.", author: "Ká Simas" },
  { text: "Sua confeitaria cresce na mesma medida em que você cresce como gestora.", author: "Ká Simas" },
  { text: "Clareza também gera lucro.", author: "Ká Simas" },
  { text: "Empresárias constroem rotina antes de construírem império.", author: "Ká Simas" },
  { text: "Quem organiza, decide. Quem decide, cresce.", author: "Ká Simas" },
  { text: "A confeitaria respira quando a confeiteira para de correr e começa a conduzir.", author: "Ká Simas" },
  { text: "Pequenos rituais diários sustentam grandes resultados mensais.", author: "Ká Simas" },
  { text: "Você não precisa fazer mais — precisa fazer com método.", author: "Ká Simas" },
  { text: "Operação organizada é a base invisível do crescimento visível.", author: "Ká Simas" },
  { text: "A próxima fase do seu negócio começa na próxima decisão consciente.", author: "Ká Simas" },
];

const svg = (d: string) =>
  h(
    "svg",
    { viewBox: "0 0 24 24" },
    h("path", { d })
  );

const ICONS = {
  cake: svg("M3 21h18v-7H3v7zM5 14V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M12 6V3M9 3h6"),
  chat: svg("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  money: svg("M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"),
  box: svg("M3 7h18M5 7v13h14V7M9 7V4h6v3"),
  megaphone: svg("M3 11v2l13 5V6L3 11zM16 8v8M19 9v6"),
  brain: svg("M12 8a4 4 0 1 0 0 .01M4 21c0-4 4-7 8-7s8 3 8 7"),
  calendar: svg("M3 5h18v16H3zM3 10h18M8 3v4M16 3v4"),
  growth: svg("M3 17l6-6 4 4 8-8M14 7h7v7"),
  users: svg("M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 21c0-3.5 3-6 7-6s7 2.5 7 6M16 11a3 3 0 1 0 0-6M22 21c0-2.5-1.8-4.6-4.5-5.4"),
  star: svg("M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"),
};

export const AREAS: Area[] = [
  {
    id: "diaria",
    label: "Hoje",
    tagline: "Rotina Diária — pequenos passos, grande controle.",
    blocks: [
      { id: "d-producao", title: "🍰 Produção", icon: ICONS.cake, items: [
        "Conferir pedidos do dia", "Separar ingredientes", "Verificar validade dos insumos",
        "Organizar bancada", "Conferir embalagens", "Planejar ordem da produção",
      ]},
      { id: "d-atendimento", title: "💬 Atendimento", icon: ICONS.chat, items: [
        "Responder clientes pendentes", "Confirmar entregas", "Conferir WhatsApp",
        "Conferir Instagram", "Enviar orçamentos pendentes",
      ]},
      { id: "d-financeiro", title: "💰 Financeiro Básico", icon: ICONS.money, items: [
        "Registrar entradas do dia", "Conferir pagamentos recebidos",
        "Conferir despesas do dia", "Evitar retiradas sem controle",
      ]},
      { id: "d-estoque", title: "📦 Estoque", icon: ICONS.box, items: [
        "Conferir insumos críticos", "Identificar itens em falta", "Validar embalagens disponíveis",
      ]},
      { id: "d-marketing", title: "📱 Marketing", icon: ICONS.megaphone, items: [
        "Postar conteúdo", "Publicar bastidores", "Responder comentários", "Atualizar status/story",
      ]},
      { id: "d-mente", title: "🧠 Mentalidade Empresarial", icon: ICONS.brain, items: [
        "Revisar prioridades do dia", "Identificar desperdícios",
        "Observar produto mais vendido", "Registrar aprendizados rápidos",
      ]},
    ],
  },
  {
    id: "semanal",
    label: "Semana",
    tagline: "Rotina Semanal — direção, números e foco.",
    blocks: [
      { id: "s-planejamento", title: "📅 Planejamento da Semana", icon: ICONS.calendar, items: [
        "Conferir agenda", "Revisar encomendas", "Planejar produção",
        "Planejar compras", "Organizar prioridades",
      ]},
      { id: "s-financeiro", title: "💵 Financeiro Semanal", icon: ICONS.money, items: [
        "Conferir entradas da semana", "Revisar pagamentos pendentes",
        "Validar despesas maiores", "Conferir margem básica",
      ]},
      { id: "s-operacional", title: "📦 Organização Operacional", icon: ICONS.box, items: [
        "Revisar estoque", "Conferir embalagens",
        "Organizar freezer/geladeira", "Separar compras futuras",
      ]},
      { id: "s-crescimento", title: "📈 Crescimento", icon: ICONS.growth, items: [
        "Analisar produto mais vendido", "Identificar produto parado",
        "Revisar metas da semana", "Planejar divulgação",
      ]},
    ],
  },
  {
    id: "mensal",
    label: "Mês",
    tagline: "🍫 Fechamento Doce do Mês — visão, lucro e próximo ciclo.",
    blocks: [
      { id: "m-financeiro", title: "💰 Financeiro do Mês", icon: ICONS.money, items: [
        "Conferir faturamento", "Conferir despesas",
        "Validar contas pendentes", "Revisar retiradas pessoais",
        "Definir Pró-Labore",
      ]},
      { id: "m-estoque", title: "📦 Estoque e Compras", icon: ICONS.box, items: [
        "Conferir ingredientes restantes", "Revisar desperdícios",
        "Planejar compras do próximo mês",
      ]},
      { id: "m-vendas", title: "📊 Produtos e Vendas", icon: ICONS.growth, items: [
        "Identificar produtos mais vendidos", "Identificar produtos com baixa saída",
        "Revisar preços dos produtos",
      ]},
      { id: "m-clientes", title: "👥 Clientes", icon: ICONS.users, items: [
        "Identificar clientes recorrentes", "Revisar novos clientes",
        "Planejar ações de relacionamento",
      ]},
      { id: "m-visao", title: "🧠 Visão Empresarial", icon: ICONS.star, items: [
        "Refleti sobre o que funcionou este mês",
        "Identifiquei o que gerou mais lucro",
        "Mapeei onde houve desperdício",
        "Defini o foco do próximo mês",
      ]},
    ],
  },
];

export const ALL_BLOCKS: Block[] = AREAS.flatMap((a) => a.blocks);

export const COMPLETION_MSGS: Record<Area["id"], string[]> = {
  diaria: ["Você organizou sua operação hoje.", "Dia conduzido com clareza.", "Rotina cumprida — base sólida."],
  semanal: ["Você agiu como empresária esta semana.", "Semana fechada com método.", "Direção clara para o próximo ciclo."],
  mensal: ["Mês revisado. Próximo capítulo começa consciente.", "Você enxergou seu negócio de cima.", "Clareza também gera lucro."],
};

// Itens que mostram campos extras (valor + observações). Chave = `${blockId}:${itemLabel}`
export const EXTRAS_ITEMS: Record<string, { amountLabel: string; notesLabel: string }> = {
  "m-financeiro:Definir Pró-Labore": {
    amountLabel: "Valor do Pró-Labore (R$)",
    notesLabel: "Observações",
  },
};

export function getWeekKey(startDate: string): string {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return `${startDate}-w${Math.max(0, diff)}`;
}

export function blockItems(block: Block, custom: Record<string, string[]>): string[] {
  return [...block.items, ...(custom[block.id] ?? [])];
}
