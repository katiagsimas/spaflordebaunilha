import { Link } from "react-router-dom";
import { Shield, FileText, Archive, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGroup } from "@/contexts/GroupContext";

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
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title="Governança"
        description="Administração e auditoria do sistema"
      />
      <div className="flex-1 p-6">
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
