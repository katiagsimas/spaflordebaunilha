import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  nome?: string | null;
  created_at?: string;
}

interface ImpersonationState {
  isImpersonating: boolean;
  token: string | null;
  targetUser: User | null;
  expiresAt: Date | null;
  reason: string | null;
}

interface ImpersonationContextType extends ImpersonationState {
  startImpersonation: (token: string, user: User, reason: string, expiresAt: Date) => void;
  endImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImpersonationState>(() => {
    // Carregar do sessionStorage se existir (mais seguro que localStorage)
    const saved = sessionStorage.getItem('impersonation_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validar se não expirou
        if (new Date(parsed.expiresAt) > new Date()) {
          return {
            ...parsed,
            expiresAt: new Date(parsed.expiresAt)
          };
        }
      } catch (e) {
        console.error('Error parsing impersonation state:', e);
      }
    }
    return {
      isImpersonating: false,
      token: null,
      targetUser: null,
      expiresAt: null,
      reason: null
    };
  });

  const startImpersonation = (token: string, user: User, reason: string, expiresAt: Date) => {
    const newState = {
      isImpersonating: true,
      token,
      targetUser: user,
      expiresAt,
      reason
    };
    setState(newState);
    // Usar sessionStorage para tokens serem limpos automaticamente ao fechar o navegador
    sessionStorage.setItem('impersonation_state', JSON.stringify({
      ...newState,
      expiresAt: expiresAt.toISOString()
    }));
  };

  const endImpersonation = async () => {
    if (state.token) {
      try {
        // Revogar token
        await supabase.rpc('revoke_admin_token', { p_token: state.token });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }
    
    setState({
      isImpersonating: false,
      token: null,
      targetUser: null,
      expiresAt: null,
      reason: null
    });
    sessionStorage.removeItem('impersonation_state');
    
    // Recarregar página para voltar à conta admin
    window.location.href = '/admin/usuarios';
  };

  // Auto-expirar quando o tempo acabar
  useEffect(() => {
    if (state.isImpersonating && state.expiresAt) {
      const now = new Date().getTime();
      const expiry = new Date(state.expiresAt).getTime();
      const timeUntilExpiry = expiry - now;
      
      if (timeUntilExpiry <= 0) {
        endImpersonation();
        return;
      }
      
      const timeout = setTimeout(() => {
        endImpersonation();
      }, timeUntilExpiry);
      
      return () => clearTimeout(timeout);
    }
  }, [state.isImpersonating, state.expiresAt]);

  return (
    <ImpersonationContext.Provider value={{ ...state, startImpersonation, endImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within ImpersonationProvider');
  }
  return context;
}
