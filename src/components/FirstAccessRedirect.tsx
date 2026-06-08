import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useGroup } from '@/contexts/GroupContext';

const ROTA_BEM_VINDA = '/onboarding/bem-vinda';
const ROTA_PROGRESSO = '/onboarding/progresso';
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

    // A partir daqui, se não concluiu, redireciona para o Progresso se tentar acessar rotas protegidas
    const rotasPermitidas = [ROTA_BEM_VINDA, ROTA_PROGRESSO, ROTA_CONCLUIDO, ROTA_DADOS, ROTA_MAO_OBRA, ROTA_BACKUP, '/onboarding'];

    const emRotaPermitida = rotasPermitidas.some((r) => location.pathname.startsWith(r));

    if (!emRotaPermitida) {
      navigate(ROTA_PROGRESSO, { replace: true });
      return;
    }

    // Se estiver na tela de progresso e já concluiu tudo (mas ainda não clicou em finalizar), deixa lá
    // Se não estiver em rota de cadastro e tentar pular passos, manda pro progresso
    // Mas vamos simplificar: o Progresso é o HUB.
    if (location.pathname === ROTA_PROGRESSO) return;

    // Verificar se pode estar na rota atual baseado no progresso
    if (loadingOnboarding || !onboardingStatus) return;
    const { temMaoObra, temBackup } = onboardingStatus;
    
    const camposObrigatoriosMeusDados = ['nome_completo', 'nome_confeitaria', 'cpf', 'whatsapp', 'cep', 'endereco', 'cidade', 'estado'];
    const meusDadosConcluido = profile && camposObrigatoriosMeusDados.every(campo => {
      const valor = (profile as any)[campo];
      return valor && String(valor).trim() !== '';
    });

    // Bloqueio de avanço forçado:
    if (location.pathname === ROTA_MAO_OBRA && !meusDadosConcluido) {
      navigate(ROTA_PROGRESSO, { replace: true });
      return;
    }
    if (location.pathname === ROTA_BACKUP && (!meusDadosConcluido || !temMaoObra)) {
      navigate(ROTA_PROGRESSO, { replace: true });
      return;
    }
    if (location.pathname === ROTA_CONCLUIDO && (!meusDadosConcluido || !temMaoObra || !temBackup)) {
      navigate(ROTA_PROGRESSO, { replace: true });
      return;
    }
  }, [profile, isLoading, onboardingStatus, loadingOnboarding, location.pathname, navigate, isAdmin, isMother, loadingAdmin, isMasterOfAnyGroup, loadingMaster]);

  return null;
}
