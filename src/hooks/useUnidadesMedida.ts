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
  created_at?: string;
  updated_at?: string;
}

const UNIDADES_PADRAO = [
  { nome: "Unidades", sigla: "un" },
  { nome: "Gramas", sigla: "g" },
  { nome: "Quilogramas", sigla: "kg" },
  { nome: "Mililitros", sigla: "ml" },
  { nome: "Litros", sigla: "l" },
  { nome: "Centímetros", sigla: "cm" },
  { nome: "Metros", sigla: "m" },
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
      
      // Se não houver unidades, criar as padrão
      if (!data || data.length === 0) {
        await createUnidadesPadrao();
        return;
      }
      
      setUnidades(data);
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
      const unidadesComUsuario = UNIDADES_PADRAO.map(u => ({
        ...u,
        usuario_id: user.id
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
