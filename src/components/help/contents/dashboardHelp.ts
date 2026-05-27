import type { HelpContent } from "@/components/help/ModuleHelpDrawer";

export const dashboardHelp: HelpContent = {
  moduleTitle: "Meu Painel",
  description:
    "O Meu Painel é a sua visão central de negócio. Aqui você acompanha encomendas confirmadas, saldo atual, contas a pagar e receber, próximas entregas e aniversariantes — tudo reunido para você ter o controle do mês em segundos.",
  recommendedFlow: ["Configurações", "Cardápio", "Encomendas", "Painel"],
  sections: [
    {
      title: "Seletor de período (ano/mês)",
      text: "Filtra todos os números do painel pelo mês escolhido. Mude para comparar resultados de períodos anteriores.",
    },
    {
      title: "Encomendas Confirmadas",
      text: "Conta os pedidos com status 'confirmado' no mês selecionado. Só aparece quando você cadastrar encomendas.",
    },
    {
      title: "Saldo Atual",
      text: "Reflete o saldo consolidado das suas contas banceiras cadastradas em Configurações → Bancos.",
    },
    {
      title: "A Receber / A Pagar",
      text: "Totaliza contas a receber e a pagar do mês. Alimentado pelo módulo Meu Dinheiro.",
    },
    {
      title: "Próximas Entregas",
      text: "Lista encomendas com data de entrega nos próximos 7 dias. Mantém você organizada sem precisar abrir o módulo de pedidos.",
    },
    {
      title: "Aniversariantes do mês",
      text: "Clientes que fazem aniversário no mês atual, para você não perder nenhuma oportunidade de venda.",
    },
    {
      title: "Visão Econômica",
      text: "Consolida faturamento, custos totais, lucro líquido, ticket médio e meta do mês. Clique em 'Anual' para ver o acumulado do ano.",
    },
  ],
  kaTip:
    "Comece preenchendo Configurações antes de tudo. O Painel só mostra números reais quando o sistema está alimentado — ele é um espelho do que você registra.",
};
