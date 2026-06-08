import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useGroup } from '@/contexts/GroupContext';

const ROTA_BEM_VINDA = '/onboarding/bem-vinda';
const ROTA_CONCLUIDO = '/onboarding/concluido';
const ROTA_DADOS = '/configuracoes/dados-confeitaria';
const ROTA_MAO_OBRA = '/configuracoes/precificacao/mao-de-obra';
const ROTA_BACKUP = '/configuracoes/backup';

export function FirstAccessRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isMother } = useGroup();

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

  // Verifica se existe perfil de mão de obra e backup
  const { data: onboardingStatus, isLoading: loadingOnboarding } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ count: moCount }, { count: bkpCount }] = await Promise.all([
        supabase.from('mao_obra_perfis').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        (supabase.from('backups' as any).select('id', { count: 'exact', head: true }).eq('usuario_id', user.id) as any),
      ]);
      return {
        temMaoObra: (moCount ?? 0) > 0,
        temBackup: (bkpCount ?? 0) > 0,
      };
    },
    enabled: !!user && !!profile && profile.ativo !== false && !isAdmin && !isMother,
  });

  // Verifica se o usuário é mestre de algum grupo ativo.
  // Quem NÃO é mestre (apenas membro USER/ADMIN secundário) pula o onboarding.
  const { data: isMasterOfAnyGroup, isLoading: loadingMaster } = useQuery({
    queryKey: ['is-master-of-any-group', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('groups')
        .select('id')
        .eq('master_user_id', user.id)
        .eq('is_active', true)
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user && !!profile && !isAdmin && !isMother,
  });

  useEffect(() => {
    if (isLoading || !profile || loadingAdmin) return;

    // Admins (legacy) e MOTHER têm acesso total — sem onboarding obrigatório
    if (isAdmin || isMother) return;


    // Usuário inativo → logout
    if (profile.ativo === false) {
      supabase.auth.signOut().then(() => {
        navigate('/auth/login', { replace: true });
      });
      return;
    }

    const p: any = profile;
    const onboardingConcluido = p.onboarding_concluido === true;
    const onboardingIniciado = p.onboarding_iniciado === true;

    // Se já concluiu, nada a fazer
    if (onboardingConcluido) return;

    // Não-mestre (USER ou ADMIN secundário em grupo de outra pessoa) pula o onboarding
    if (loadingMaster) return;
    if (isMasterOfAnyGroup === false) return;


    // Etapa 0: Boas-vindas — antes de qualquer cadastro
    if (!onboardingIniciado) {
      if (location.pathname !== ROTA_BEM_VINDA) {
        navigate(ROTA_BEM_VINDA, { replace: true });
      }
      return;
    }

    // Etapa 1: Meus Dados (Dados da Confeitaria) — obrigatório para TODOS
    const camposObrigatoriosMeusDados = [
      'nome_completo',
      'nome_confeitaria',
      'cpf',
      'whatsapp',
      'cep',
      'endereco',
      'cidade',
      'estado',
    ] as const;
    const dadosIncompletos =
      profile.primeiro_acesso ||
      camposObrigatoriosMeusDados.some((campo) => {
        const valor = (profile as any)[campo];
        return !valor || String(valor).trim() === '';
      });

    if (dadosIncompletos) {
      if (location.pathname !== ROTA_DADOS) {
        navigate(ROTA_DADOS, { replace: true });
      }
      return;
    }

    // Etapas 2 e 3 dependem de consultas adicionais
    if (loadingOnboarding || !onboardingStatus) return;
    const { temMaoObra, temBackup } = onboardingStatus;

    // Etapa 2: Mão de Obra
    if (!temMaoObra) {
      const rotasPermitidas = [ROTA_MAO_OBRA, ROTA_DADOS];
      const emRotaPermitida = rotasPermitidas.some((r) => location.pathname.startsWith(r));
      if (!emRotaPermitida) {
        navigate(ROTA_MAO_OBRA, { replace: true });
      }
      return;
    }

    // Etapa 3: Backup
    if (!temBackup) {
      const rotasPermitidas = [ROTA_BACKUP, ROTA_MAO_OBRA, ROTA_DADOS];
      const emRotaPermitida = rotasPermitidas.some((r) => location.pathname.startsWith(r));
      if (!emRotaPermitida) {
        navigate(ROTA_BACKUP, { replace: true });
      }
      return;
    }

    // Etapa 4: Tudo preenchido, mas ainda não marcou onboarding_concluido
    // → exibe o cartão de conclusão
    if (location.pathname !== ROTA_CONCLUIDO) {
      navigate(ROTA_CONCLUIDO, { replace: true });
    }
  }, [profile, isLoading, onboardingStatus, loadingOnboarding, location.pathname, navigate, isAdmin, isMother, loadingAdmin, isMasterOfAnyGroup, loadingMaster]);

  return null;
}
