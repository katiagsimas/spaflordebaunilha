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
      <div className="p-6">
        {/* ===== HEADER PREMIUM (mesmo padrão do módulo Encomendas) ===== */}
        <div
          className="relative overflow-hidden rounded-2xl border border-[#5B1A2B]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
          style={{ background: "#FAEFEB" }}
        >
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-normal leading-tight text-[#3D0F1C] sm:text-3xl lg:text-[36px]">
                Governança
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
                <p className="text-xs italic text-[#C9A14A] sm:text-sm">
                  Administração e auditoria do sistema
                </p>
              </div>
            </div>
            <img
              src={governancaFooter}
              alt=""
              aria-hidden="true"
              className="pointer-events-none mt-4 w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 px-6 pb-6">

        <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
          {cards.map(({ title, description, icon: Icon, url }) => (
            <Link key={url} to={url} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-cda-dourado/60 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-cda-vinho/10 flex items-center justify-center group-hover:bg-cda-vinho/15 transition-colors">
                        <Icon className="h-5 w-5 text-cda-vinho" />
                      </div>
                      <CardTitle className="font-display text-lg">{title}</CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-cda-dourado group-hover:translate-x-0.5 transition-all" />
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
