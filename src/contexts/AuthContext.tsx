import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldCheckFirstAccess, setShouldCheckFirstAccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let subscription: any;

    // Set up auth state listener
    const setupAuth = async () => {
      const { data } = await supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Marcar para verificar primeiro acesso quando usuário logar
        if (session?.user && _event === 'SIGNED_IN') {
          setShouldCheckFirstAccess(true);
          // Atualizar last_login a cada login
          supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => {});
        }
      });

      subscription = data.subscription;

      // THEN check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
    };

    setupAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se o usuário está ativo e se o plano não está expirado
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('ativo, plano_fim')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao verificar status do usuário:', profileError);
        }

        // Plano expirado → desativa e bloqueia acesso
        const hoje = new Date().toISOString().split('T')[0];
        const planoExpirado = !!profile?.plano_fim && profile.plano_fim < hoje;

        if (profile && (profile.ativo === false || planoExpirado)) {
          if (planoExpirado && profile.ativo !== false) {
            // Persiste a inativação (o trigger no banco também garante isso)
            await supabase
              .from('profiles')
              .update({ ativo: false })
              .eq('id', data.user.id);
          }
          await supabase.auth.signOut();
          throw new Error(
            planoExpirado
              ? 'Seu plano expirou. Entre em contato com o administrador para renovar.'
              : 'Sua conta foi desabilitada. Entre em contato com o administrador.'
          );
        }
      }

      toast({
        title: '✅ Bem-vindo(a) de volta!',
        description: 'Login realizado com sucesso.',
      });

      // Toast de boas-vindas após renovação automática a partir da Imersão
      if (data.user) {
        try {
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: hist } = await supabase
            .from('historico_planos')
            .select('id, plano_novo, created_at')
            .eq('user_id', data.user.id)
            .eq('tipo_evento', 'renovacao_imersao')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (hist?.id) {
            const flagKey = `cda-renovacao-toast-${hist.id}`;
            if (!localStorage.getItem(flagKey)) {
              const planoNome = hist.plano_novo === 'negocio' ? 'Caixa Business' : 'Caixa Lite';
              toast({
                title: '🎉 Renovação confirmada!',
                description: `Bem-vinda ao ${planoNome}. Seus dados foram preservados.`,
              });
              localStorage.setItem(flagKey, '1');
            }
            // Limpa flags do modal de expiração da Imersão para não reaparecer
            try {
              sessionStorage.removeItem('cda-modal-imersao-shown');
            } catch {}
          }
        } catch (e) {
          console.warn('[AuthContext] check renovação imersão falhou:', e);
        }
      }
    } catch (error: any) {
      let message = 'Erro ao fazer login. Tente novamente.';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Por favor, confirme seu email antes de fazer login.';
      } else if (error.message?.includes('desabilitada') || error.message?.includes('expirou')) {
        message = error.message;
      }

      toast({
        title: '❌ Erro no login',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Ignorar erro de sessão inexistente — já está deslogado
      if (error && !error.message?.toLowerCase().includes('session')) {
        throw error;
      }
    } catch (error: any) {
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      toast({
        title: '❌ Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setUser(null);
    setSession(null);
    toast({
      title: '👋 Até logo!',
      description: 'Você saiu da sua conta.',
    });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://caixa.umbrelladoce.com.br/auth/reset-password',
      });

      if (error) throw error;

      toast({
        title: '✅ Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: 'Não foi possível enviar o email. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
