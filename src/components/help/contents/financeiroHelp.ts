import type { HelpContent } from "@/components/help/ModuleHelpDrawer";

export const financeiroHelp: HelpContent = {
  moduleTitle: "Meu Dinheiro",
  description:
    "O Meu Dinheiro centraliza toda a vida financeira da sua confeitaria. Aqui você registra contas a pagar e receber, acompanha o fluxo de caixa, visualiza o DRE e faz o fechamento mensal.",
  recommendedFlow: ["Bancos", "Contas a Pagar", "Contas a Receber", "Fluxo de Caixa", "DRE"],
  sections: [
    {
      title: "Contas a Receber",
      text: "Valores que você tem a receber de clientes e encomendas.",
    },
    {
      title: "Contas a Pagar",
      text: "Despesas, fornecedores, custos fixos.",
    },
    {
      title: "Fluxo de Caixa",
      text: "Entradas e saídas no período, mostra a saúde do caixa.",
    },
    {
      title: "DRE",
      text: "Demonstração de Resultado — receita bruta, custos e lucro líquido.",
    },
    {
      title: "Fechamento de Mês",
      text: "Congela os dados do mês encerrado, não pode ser desfeito.",
    },
  ],
  kaTip:
    "Registre seus custos fixos em Configurações → Custos Fixos antes de usar o DRE. Sem isso, o lucro calculado vai parecer maior do que é.",
};
