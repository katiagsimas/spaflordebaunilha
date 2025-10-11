import { ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showGreeting?: boolean;
}

export function PageHeader({ title, description, actions, showGreeting = false }: PageHeaderProps) {
  const [nomeNegocio] = useLocalStorage<string>("nomeNegocio", "");
  
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
        <div>
          {showGreeting && nomeNegocio && (
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-foreground">Olá, {nomeNegocio}! 👋</h2>
              <p className="text-sm text-muted-foreground">{getCurrentDate()}</p>
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
