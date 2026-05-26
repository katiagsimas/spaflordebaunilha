import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UnidadeMedida {
  id: string;
  usuario_id: string;
  nome: string;
  sigla: string;
  codigo?: string;
  ativo?: boolean;
  e_padrao?: boolean;
  created_at?: string;
  updated_at?: string;
}

const UNIDADES_PADRAO = [
  { nome: "Centímetros", sigla: "cm" },
  { nome: "Gramas", sigla: "g" },
  { nome: "Mililitros", sigla: "ml" },
  { nome: "Unidades", sigla: "un" },
];

export function useUnidadesMedida() {
  const { user } = useAuth();
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnidades = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        await createUnidadesPadrao();
      } else {
        setUnidades(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar unidades:', err);
      toast.error('Erro ao carregar unidades: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const gerarProximoCodigo = async (): Promise<string> => {
    if (!user) return '001';
    
    const { data, error } = await supabase
      .from('unidades_medida')
      .select('codigo')
      .eq('usuario_id', user.id)
      .order('codigo', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return '001';
    }
    
    const ultimoCodigo = data[0].codigo;
    if (!ultimoCodigo) return '001';
    
    const proximoNumero = parseInt(ultimoCodigo) + 1;
    return proximoNumero.toString().padStart(3, '0');
  };

  const createUnidadesPadrao = async () => {
    if (!user) return;
    
    try {
      const { data: existentes } = await supabase
        .from('unidades_medida')
        .select('id')
        .eq('usuario_id', user.id)
        .limit(1);
      
      if (existentes && existentes.length > 0) {
        const { data } = await supabase
          .from('unidades_medida')
          .select('*')
          .eq('usuario_id', user.id)
          .order('nome', { ascending: true });

        setUnidades(data || []);
        return;
      }

      const unidadesComUsuario = UNIDADES_PADRAO.map((u, index) => ({
        ...u,
        usuario_id: user.id,
        codigo: (index + 1).toString().padStart(3, '0'),
        e_padrao: true,
        ativo: true
      }));

      const { data, error } = await supabase
        .from('unidades_medida')
        .insert(unidadesComUsuario)
        .select();

      if (error) throw error;
      setUnidades(data || []);
    } catch (err: any) {
      console.error('Erro ao criar unidades padrão:', err);
    }
  };

  const createUnidade = async (unidade: Omit<UnidadeMedida, 'id' | 'usuario_id' | 'created_at' | 'updated_at' | 'codigo' | 'ativo'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const codigo = await gerarProximoCodigo();

    const { data, error } = await supabase
      .from('unidades_medida')
      .insert({ ...unidade, usuario_id: user.id, codigo, ativo: true })
      .select()
      .single();

    if (error) throw error;
    setUnidades([...unidades, data]);
    toast.success('Unidade criada com sucesso!');
    return data;
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se é uma unidade padrão
    const unidade = unidades.find(u => u.id === id);
    if (unidade?.e_padrao && !ativo) {
      throw new Error('Não é possível desabilitar unidades padrão do sistema');
    }

    const { data, error } = await supabase
      .from('unidades_medida')
      .update({ ativo })
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUnidades(unidades.map(u => u.id === id ? data : u));
    toast.success(ativo ? 'Unidade reativada!' : 'Unidade desabilitada!');
    return data;
  };

  const updateUnidade = async (id: string, updates: Partial<UnidadeMedida>) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se é uma unidade padrão
    const unidade = unidades.find(u => u.id === id);
    if (unidade?.e_padrao) {
      // Permitir apenas atualizar sigla das unidades padrão
      const { e_padrao, nome, ativo, ...allowedUpdates } = updates;
      updates = allowedUpdates;
    }

    const { data, error } = await supabase
      .from('unidades_medida')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUnidades(unidades.map(u => u.id === id ? data : u));
    toast.success('Unidade atualizada!');
    return data;
  };

  const deleteUnidade = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('unidades_medida')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setUnidades(unidades.filter(u => u.id !== id));
    toast.success('Unidade deletada!');
  };

  useEffect(() => {
    if (user) fetchUnidades();
  }, [user]);

  return {
    unidades,
    loading,
    createUnidade,
    updateUnidade,
    deleteUnidade,
    toggleAtivo,
    refetch: fetchUnidades,
  };
}
