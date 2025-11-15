import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  nome_completo?: string;
  nome_confeitaria?: string;
  telefone?: string;
  avatar_url?: string;
  cpf?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  instagram?: string;
  whatsapp?: string;
  dias_trabalho_mes: number;
  horas_diaria_trabalho: number;
  valor_hora?: number;
  primeiro_acesso?: boolean;
  meta_faturamento_mensal?: number;
  meta_faturamento_anual?: number;
  alerta_cmv?: number;
  custo_fixo_mensal?: number;
  planejamento_banner_dismissed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      console.error('Erro ao buscar perfil:', err);
      toast.error('Erro ao carregar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar estado local
      setProfile(prev => prev ? { ...prev, ...updates } : null);

      toast.success('Configurações atualizadas!');
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      toast.error('Não foi possível atualizar as configurações: ' + err.message);
      return false;
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
  };
}
