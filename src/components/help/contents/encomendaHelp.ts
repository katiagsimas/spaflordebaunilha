import type { HelpContent } from "@/components/help/ModuleHelpDrawer";

export const encomendaHelp: HelpContent = {
  moduleTitle: "Encomendas",
  description:
    "Aqui ficam todos os seus pedidos. Você registra a encomenda, define itens, valores, data de entrega e cliente — e o sistema cuida de criar automaticamente a conta a receber vinculada.",
  recommendedFlow: ["Clientes", "Cardápio", "Nova Encomenda"],
  sections: [
    {
      title: "Nova Encomenda",
      text: "Preencha cliente, itens do pedido, data de entrega e forma de pagamento.",
    },
    {
      title: "Status do pedido",
      text: "Em aberto → Confirmado → Entregue; mude conforme a encomenda avança.",
    },
    {
      title: "Vínculo financeiro",
      text: "Ao confirmar, o sistema cria automaticamente uma conta a receber em Meu Dinheiro.",
    },
    {
      title: "Tags",
      text: "Categorize pedidos por tipo — aniversário, casamento, corporativo — para filtrar e gerar relatórios.",
    },
  ],
  kaTip:
    "Cadastre o cliente antes de criar a encomenda. Se o cliente não existir, você pode criá-lo direto na tela de nova encomenda sem sair do fluxo.",
};
