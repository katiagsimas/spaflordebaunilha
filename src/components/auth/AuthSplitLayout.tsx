import { ReactNode } from 'react';
import authSideAsset from '@/assets/capa-autenticacao.png.asset.json';
import authBgAsset from '@/assets/auth-background-new.png.asset.json';

interface AuthSplitLayoutProps {
  children: ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div 
      className="min-h-screen flex bg-sfb-baunilha bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${authBgAsset.url})` }}
    >
      {/* Lateral esquerda com a arte da marca */}
      <aside className="hidden lg:flex w-1/2 items-center justify-center p-10 bg-white/10 backdrop-blur-[2px]">
        <img
          src={authSideAsset.url}
          alt="Spa Flor de Baunilha"
          className="max-h-[85vh] w-auto object-contain"
        />
      </aside>

      {/* Área do formulário */}
      <main className="flex-1 flex items-center justify-center p-6 pb-48 relative overflow-hidden backdrop-blur-[2px]">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        {children}
      </main>
    </div>
  );
}
