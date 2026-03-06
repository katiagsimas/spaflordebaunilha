import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingMascote } from '@/components/LoadingMascote';

export default function SSO() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setErro('Token SSO não fornecido.');
      return;
    }

    const autenticar = async () => {
      try {
        // Call our edge function to validate the SSO token
        const { data, error } = await supabase.functions.invoke('validar-token-sso', {
          body: { token },
        });

        if (error || !data?.success) {
          setErro(data?.error || error?.message || 'Falha na autenticação SSO.');
          return;
        }

        // Use the token_hash to verify OTP and create session
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'magiclink',
        });

        if (otpError) {
          console.error('Erro ao verificar OTP:', otpError);
          setErro('Erro ao criar sessão. Tente novamente.');
          return;
        }

        // Session created successfully, redirect
        navigate(data.redirect_to || '/dashboard', { replace: true });
      } catch (err) {
        console.error('Erro SSO:', err);
        setErro('Erro inesperado na autenticação.');
      }
    };

    autenticar();
  }, [searchParams, navigate]);

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app gap-4 p-6">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-semibold text-foreground text-center">
          Falha na autenticação
        </h1>
        <p className="text-muted-foreground text-center max-w-md">{erro}</p>
        <button
          onClick={() => navigate('/auth/login', { replace: true })}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          Ir para o Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <LoadingMascote size={80} label="Autenticando via Umbrella Doce..." />
    </div>
  );
}
