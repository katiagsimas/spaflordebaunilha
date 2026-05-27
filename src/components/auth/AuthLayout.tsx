import { ReactNode } from 'react';
import authBackground from '@/assets/auth-background-full.jpg';

/**
 * Layout padronizado para todas as telas de autenticação.
 * - Imagem de fundo cobre 100% da tela (mobile, tablet, desktop).
 * - Card de autenticação posicionado na área demarcada (direita em telas grandes, centralizado em mobile).
 * - Overlay sutil garante contraste e legibilidade do card.
 */
interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-cda-preto">
      {/* Imagem de fundo full-screen */}
      <img
        src={authBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlay sutil para harmonia e contraste do card */}
      <div className="absolute inset-0 bg-cda-preto/40 lg:bg-gradient-to-r lg:from-cda-preto/10 lg:via-cda-preto/20 lg:to-cda-preto/50" />

      {/* Container do card — centralizado em mobile/tablet, alinhado à direita no demarcado em desktop */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-4 py-8 lg:justify-end lg:pr-[6vw] xl:pr-[8vw]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
