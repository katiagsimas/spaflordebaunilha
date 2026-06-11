import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';

const KEY = '__cda_mother_view_plan__';
const EVT = 'cda:mother-view-changed';

export const MOTHER_EMAIL = 'katiagsimas@gmail.com';

export type MotherViewPlan = 'base' | 'negocio' | null;

export function isMotherUser(email?: string | null, isMother?: boolean): boolean {
  if (!isMother) return false;
  return (email ?? '').toLowerCase() === MOTHER_EMAIL;
}

function readStored(): MotherViewPlan {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(KEY);
  return v === 'base' || v === 'negocio' || v === 'aluna_imersao' ? v : null;
}

/**
 * Hook do "modo de visualização" do MOTHER.
 * - `enabled`: true apenas se o usuário logado é o MOTHER oficial.
 * - `view`: plano que o MOTHER está visualizando agora (ou null = acesso total).
 * - `setMotherView`: altera o plano em visualização.
 */
export function useMotherView() {
  const { user } = useAuth();
  const { isMother } = useGroup();
  const enabled = isMotherUser(user?.email, isMother);
  const [view, setView] = useState<MotherViewPlan>(readStored);

  useEffect(() => {
    const handler = () => setView(readStored());
    window.addEventListener(EVT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const setMotherView = useCallback((v: MotherViewPlan) => {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { enabled, view, setMotherView };
}
