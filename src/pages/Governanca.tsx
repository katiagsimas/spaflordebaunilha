import { Link } from "react-router-dom";
import { Shield, FileText, Archive, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGroup } from "@/contexts/GroupContext";
import { HeroBanner } from "@/components/HeroBanner";
import governancaHero from "@/assets/governanca-hero-banner.png";

export default function Governanca() {
  const { isMother } = useGroup();

  if (!isMother) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader title="Governança" description="Acesso restrito" />
        <div className="flex-1 p-6">
          <PermissionGuard requireMother />
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Usuários",
      description: "Gestão de usuários, grupos e permissões do sistema.",
      icon: Shield,
      url: "/admin/usuarios",
    },
    {
      title: "Log de Ações",
      description: "Histórico de ações realizadas pelos usuários no sistema.",
      icon: FileText,
      url: "/admin/logs",
    },
    {
      title: "Cofre de Backups",
      description: "Espelho automático de backups de todos os grupos para suporte (dia 1 do mês + 5 últimos).",
      icon: Archive,
      url: "/admin/cofre-backups",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        {/* HERO BANNER padronizado */}
        <HeroBanner
          image={governancaHero}
          title="Governança"
          subtitle="Administração e auditoria do sistema."
          imageAlt="Governança"
        />
      </div>

      <div className="flex-1 px-6 pb-6">

        <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
          {cards.map(({ title, description, icon: Icon, url }) => (
            <Link key={url} to={url} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg border-sfb-dourado/40 hover:border-sfb-dourado/60 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-sfb-vinho/10 flex items-center justify-center group-hover:bg-sfb-vinho/15 transition-colors">
                        <Icon className="h-5 w-5 text-sfb-vinho" />
                      </div>
                      <CardTitle className="font-display text-lg">{title}</CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-sfb-dourado group-hover:translate-x-0.5 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-body text-sm">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
