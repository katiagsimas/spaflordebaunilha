import { ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showGreeting?: boolean;
  backButton?: ReactNode;
}

export function PageHeader({ title, description, actions, showGreeting = false, backButton }: PageHeaderProps) {
  const { profile } = useUserProfile();
  const nomeNegocio = profile?.nome_confeitaria || "";
  
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('pt-BR', options);
  };

  return (
    <div className="bg-card border-b border-border shadow-[0_1px_3px_rgba(107,80,71,0.05)] px-8 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          {showGreeting && nomeNegocio && (
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-foreground">Olá, {nomeNegocio}! 👋</h2>
              <p className="text-sm text-muted-foreground">{getCurrentDate()}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            {backButton}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
