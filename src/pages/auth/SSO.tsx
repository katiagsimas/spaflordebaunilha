import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingMascote } from '@/components/LoadingMascote';

export default function SSOPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }

    const autenticar = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('validar-token-sso', {
          body: { token }
        });

        if (error || !data?.redirect_url) {
          setStatus('error');
          return;
        }

        // Redirecionar para o magic link — autentica automaticamente
        window.location.href = data.redirect_url;

      } catch {
        setStatus('error');
      }
    };

    autenticar();
  }, []);

  // Tela de loading
  if (status === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app">
      <LoadingMascote size={80} label="Preparando seu acesso..." />
    </div>
  );

  // Tela de erro
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-foreground font-medium text-base">Link expirado ou inválido.</p>
      <p className="text-muted-foreground text-sm mt-1 mb-6">
        Acesse novamente pela Plataforma Umbrella Doce.
      </p>
      <a
        href="https://umbrelladoce.lovable.app"
        className="text-accent text-sm underline"
      >
        Voltar para a Umbrella Doce →
      </a>
    </div>
  );
}
