import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nomeCompleto: string, nomeConfeitaria: string) => Promise<void>;
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Marcar para verificar primeiro acesso quando usuário logar
      if (session?.user && _event === 'SIGNED_IN') {
        setShouldCheckFirstAccess(true);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: '✅ Bem-vindo(a) de volta!',
        description: 'Login realizado com sucesso.',
      });
    } catch (error: any) {
      let message = 'Erro ao fazer login. Tente novamente.';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Por favor, confirme seu email antes de fazer login.';
      }

      toast({
        title: '❌ Erro no login',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    nomeCompleto: string,
    nomeConfeitaria: string
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome_completo: nomeCompleto,
            nome_confeitaria: nomeConfeitaria,
          },
        },
      });

      if (error) throw error;

      toast({
        title: '✅ Conta criada com sucesso!',
        description: 'Você já pode começar a usar o sistema.',
      });
    } catch (error: any) {
      let message = 'Erro ao criar conta. Tente novamente.';
      
      if (error.message?.includes('already registered')) {
        message = 'Este email já está cadastrado.';
      } else if (error.message?.includes('Password should be')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }

      toast({
        title: '❌ Erro no cadastro',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: '👋 Até logo!',
        description: 'Você saiu da sua conta.',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
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
    signUp,
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
