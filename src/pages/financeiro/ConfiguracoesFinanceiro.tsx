import { Settings, FolderTree, FileText, CreditCard, Building2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

const opcoes = [
  {
    title: "Categorias Planos de Contas",
    description: "Gerencie as categorias para organizar seu plano de contas",
    icon: FolderTree,
    color: "text-primary bg-primary/10",
    url: "/financeiro/configuracoes/categorias",
  },
  {
    title: "Planos de Contas",
    description: "Configure e organize seu plano de contas contábil",
    icon: FileText,
    color: "text-accent bg-accent/10",
    url: "/financeiro/configuracoes/planos-contas",
  },
  {
    title: "Tipos de Documento",
    description: "Cadastre formas de pagamento e tipos de documento",
    icon: CreditCard,
    color: "text-success bg-success/10",
    url: "/financeiro/configuracoes/tipos-documento",
  },
  {
    title: "Bancos",
    description: "Gerencie as instituições bancárias utilizadas",
    icon: Building2,
    color: "text-secondary bg-secondary/10",
    url: "/financeiro/configuracoes/bancos",
  },
];

export default function ConfiguracoesFinanceiro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <BackButton to="/financeiro" />
      </div>
      
      <PageHeader
        title="Configurações Financeiras"
        description="Configure categorias, planos de contas e formas de pagamento"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.title}
              className={`transition-all duration-200 cursor-pointer hover:shadow-elevated hover:-translate-y-1 animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(opcao.url)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${opcao.color} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                </div>
                <CardTitle className="text-lg md:text-2xl">{opcao.title}</CardTitle>
                <CardDescription>{opcao.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
