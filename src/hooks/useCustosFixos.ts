import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CustoFixo {
  id: string;
  usuario_id: string;
  nome: string;
  valor: number;
  tipo: 'fixo' | 'mao_obra_indireta' | 'outros';
  created_at?: string;
  updated_at?: string;
}

// Função para categorizar automaticamente o tipo de custo baseado no nome
const categorizarCustoFixo = (nome: string): 'fixo' | 'mao_obra_indireta' | 'outros' => {
  const nomeNormalizado = nome.toLowerCase().trim();
  
  const termosMaoObraIndireta = [
    'salário',
    'salario',
    'pro labore',
    'pró-labore',
    'pró labore',
    'pro-labore',
    'encargos',
    'folha',
    'mão de obra',
    'mao de obra'
  ];
  
  const contemTermo = termosMaoObraIndireta.some(termo => 
    nomeNormalizado.includes(termo)
  );
  
  return contemTermo ? 'mao_obra_indireta' : 'fixo';
};

export function useCustosFixos() {
  const { user } = useAuth();
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustosFixos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      // Type assertion para garantir que o tipo seja reconhecido corretamente
      setCustosFixos((data || []) as CustoFixo[]);
    } catch (err: any) {
      console.error('Erro ao buscar custos fixos:', err);
      toast.error('Erro ao carregar custos fixos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCustoFixo = async (custo: Omit<CustoFixo, 'id' | 'usuario_id' | 'created_at' | 'updated_at' | 'tipo'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Categorizar automaticamente o tipo baseado no nome
    const tipo = categorizarCustoFixo(custo.nome);

    const { data, error } = await supabase
      .from('custos_fixos')
      .insert({ ...custo, tipo, usuario_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setCustosFixos([...custosFixos, data as CustoFixo]);
    toast.success('Custo fixo criado com sucesso!');
    return data;
  };

  const updateCustoFixo = async (id: string, updates: Partial<CustoFixo>) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Se o nome está sendo atualizado, recategorizar o tipo
    const updatesComTipo = updates.nome 
      ? { ...updates, tipo: categorizarCustoFixo(updates.nome) }
      : updates;

    const { data, error } = await supabase
      .from('custos_fixos')
      .update(updatesComTipo)
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setCustosFixos(custosFixos.map(c => c.id === id ? data as CustoFixo : c));
    toast.success('Custo fixo atualizado!');
    return data;
  };

  const deleteCustoFixo = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('custos_fixos')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) throw error;
    setCustosFixos(custosFixos.filter(c => c.id !== id));
    toast.success('Custo fixo deletado!');
  };

  useEffect(() => {
    if (user) fetchCustosFixos();
  }, [user]);

  return {
    custosFixos,
    loading,
    createCustoFixo,
    updateCustoFixo,
    deleteCustoFixo,
    refetch: fetchCustosFixos,
  };
}
