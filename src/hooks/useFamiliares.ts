import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Familiar {
  id: string;
  cliente_id: string;
  usuario_id: string;
  nome: string;
  parentesco: string;
  data_nascimento: string;
  observacoes?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useFamiliares(clienteId?: string) {
  const { user } = useAuth();
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFamiliares = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let query = supabase
        .from('cliente_familiares')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true);
      
      // Se clienteId for fornecido, filtra por ele
      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }
      
      const { data, error } = await query.order('nome');

      if (error) throw error;
      setFamiliares(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar familiares:', err);
      toast.error('Erro ao carregar familiares: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createFamiliar = async (familiar: Omit<Familiar, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('cliente_familiares')
      .insert({ ...familiar, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setFamiliares([...familiares, data]);
    toast.success('Familiar cadastrado com sucesso!');
    return data;
  };

  const updateFamiliar = async (id: string, updates: Partial<Familiar>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('cliente_familiares')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setFamiliares(familiares.map(f => f.id === id ? data : f));
    toast.success('Familiar atualizado!');
    return data;
  };

  const deleteFamiliar = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('cliente_familiares')
      .update({ ativo: false })
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setFamiliares(familiares.filter(f => f.id !== id));
    toast.success('Familiar removido!');
  };

  useEffect(() => {
    if (user) fetchFamiliares();
  }, [user, clienteId]);

  return {
    familiares,
    loading,
    createFamiliar,
    updateFamiliar,
    deleteFamiliar,
    refetch: fetchFamiliares,
  };
}
