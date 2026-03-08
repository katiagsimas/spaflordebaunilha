import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingMascote } from '@/components/LoadingMascote';

export default function SSOPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }

    const autenticar = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('validar-token-sso', {
          body: { token }
        });

        if (error || !data?.token_hash) {
          setStatus('error');
          return;
        }

        // Verificar OTP diretamente no cliente — cria sessão sem redirecionamento
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'magiclink',
        });

        if (otpError) {
          console.error('Erro ao verificar OTP:', otpError);
          setStatus('error');
          return;
        }

        // Sessão criada com sucesso — navegar para o dashboard
        navigate('/dashboard', { replace: true });

      } catch {
        setStatus('error');
      }
    };

    autenticar();
  }, []);

  if (status === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app">
      <LoadingMascote size={80} label="Preparando seu acesso..." />
    </div>
  );

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
