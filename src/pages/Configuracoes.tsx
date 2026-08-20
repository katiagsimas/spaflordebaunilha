import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, HardDrive, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Configuracoes() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Seus Dados",
      description: "Suas informações pessoais e contatos",
      icon: Building2,
      to: "/configuracoes/dados-confeitaria",
    },
    {
      title: "Backup e Segurança",
      description: "Gerencie suas cópias de segurança e exportação de dados",
      icon: HardDrive,
      to: "/configuracoes/backup",
    },
    {
      title: "Preferências do Sistema",
      description: "Tags, categorias e configurações gerais",
      icon: Settings,
      to: "/cadastros",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Configurações"
        description="Gerencie as informações e preferências da sua conta"
      />
      
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card 
              key={section.to}
              className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-sfb-terracota/60"
              onClick={() => navigate(section.to)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sfb-baunilha text-sfb-terracota flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold leading-tight text-sfb-cacau">
                      {section.title}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs text-sfb-cacau/60">
                  {section.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
