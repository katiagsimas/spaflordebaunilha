import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** mantido por compatibilidade — não é mais utilizado visualmente */
  showGreeting?: boolean;
  backButton?: ReactNode;
}

/**
 * Header padrão do sistema, seguindo a linguagem do Dashboard:
 * - Título em font-display, cor sfb-vinho-escuro
 * - Fio dourado decorativo + subtítulo italic em sfb-vinho/70
 * - Slot opcional para ações à direita
 */
export function PageHeader({ title, description, actions, backButton }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {backButton && (
        <div className="flex flex-wrap items-center gap-2">
          {backButton}
        </div>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col items-start">
          <h1 className="font-display text-3xl tracking-tight text-sfb-cacau sm:text-4xl">
            {title}
          </h1>
          {description && (
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-12 bg-sfb-terracota" />
              <p className="text-sm font-body italic text-sfb-cacau/70">
                {description}
              </p>
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
