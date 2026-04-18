import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export function FirstAccessRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Verifica se existe ao menos 1 ingrediente, 1 embalagem e 1 backup
  const { data: onboardingStatus, isLoading: loadingOnboarding } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ count: ingCount }, { count: embCount }, { count: bkpCount }] = await Promise.all([
        supabase.from('ingredientes').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id),
        supabase.from('embalagens').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id),
        (supabase.from('backups' as any).select('id', { count: 'exact', head: true }).eq('usuario_id', user.id) as any),
      ]);
      return {
        temIngrediente: (ingCount ?? 0) > 0,
        temEmbalagem: (embCount ?? 0) > 0,
        temBackup: (bkpCount ?? 0) > 0,
      };
    },
    enabled: !!user && !!profile && profile.ativo !== false && !!profile.nome_confeitaria && !profile.primeiro_acesso && !isAdmin,
  });

  useEffect(() => {
    if (isLoading || !profile || loadingAdmin) return;

    // Admins têm acesso total — sem restrições de onboarding
    if (isAdmin) return;

    // Usuário inativo → logout
    if (profile.ativo === false) {
      supabase.auth.signOut().then(() => {
        navigate('/auth/login', { replace: true });
      });
      return;
    }

    // Etapa 1: Dados da Confeitaria incompletos
    const dadosIncompletos = profile.primeiro_acesso || !profile.nome_confeitaria;
    if (dadosIncompletos) {
      if (location.pathname !== '/configuracoes/dados-confeitaria') {
        navigate('/configuracoes/dados-confeitaria', { replace: true });
      }
      return;
    }

    // Etapa 2: Insumos, Embalagens e Backup obrigatórios
    if (loadingOnboarding || !onboardingStatus) return;
    const temInsumos = onboardingStatus.temIngrediente && onboardingStatus.temEmbalagem;
    const temBackup = onboardingStatus.temBackup;

    // Etapa 2a: Falta insumos/embalagens
    if (!temInsumos) {
      const rotasPermitidas = [
        '/configuracoes/tipos-insumos',
        '/configuracoes/dados-confeitaria',
      ];
      const emRotaPermitida = rotasPermitidas.some((r) => location.pathname.startsWith(r));
      if (!emRotaPermitida) {
        navigate('/configuracoes/tipos-insumos', { replace: true });
      }
      return;
    }

    // Etapa 2b: Falta backup inicial
    if (!temBackup) {
      const rotasPermitidas = [
        '/configuracoes/backup',
        '/configuracoes/tipos-insumos',
        '/configuracoes/dados-confeitaria',
      ];
      const emRotaPermitida = rotasPermitidas.some((r) => location.pathname.startsWith(r));
      if (!emRotaPermitida) {
        navigate('/configuracoes/backup', { replace: true });
      }
    }
  }, [profile, isLoading, onboardingStatus, loadingOnboarding, location.pathname, navigate, isAdmin, loadingAdmin]);

  return null;
}
