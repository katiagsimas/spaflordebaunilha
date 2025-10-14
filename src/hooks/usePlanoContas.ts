import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlanoConta {
  id: string;
  usuario_id: string;
  codigo: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA' | 'ATIVO' | 'PASSIVO';
  categoria?: string;
  conta_pai_id?: string;
  nivel: number;
  natureza?: 'CREDORA' | 'DEVEDORA';
  aceita_lancamento: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export function usePlanoContas() {
  const { user } = useAuth();
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlanoContas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planos_contas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('codigo');

      if (error) throw error;
      setPlanoContas((data || []) as PlanoConta[]);
    } catch (err: any) {
      console.error('Erro ao buscar plano de contas:', err);
      toast.error('Erro ao carregar plano de contas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createConta = async (conta: Omit<PlanoConta, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('planos_contas')
        .insert({
          ...conta,
          usuario_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPlanoContas([...planoContas, data as PlanoConta]);
      toast.success(`✅ Conta criada: ${conta.codigo} - ${conta.nome}`);
      return data as PlanoConta;
    } catch (err: any) {
      console.error('Erro ao criar conta:', err);
      
      let errorMessage = err.message;
      if (err.code === '23505') {
        errorMessage = 'Código de conta já existe. Use um código diferente.';
      }
      
      toast.error('Erro ao criar conta: ' + errorMessage);
      throw err;
    }
  };

  const updateConta = async (id: string, updates: Partial<PlanoConta>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('planos_contas')
        .update(updates)
        .eq('id', id)
        .eq('usuario_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPlanoContas(planoContas.map(c => c.id === id ? data as PlanoConta : c));
      toast.success('✅ Conta atualizada com sucesso!');
      return data as PlanoConta;
    } catch (err: any) {
      console.error('Erro ao atualizar conta:', err);
      toast.error('Erro ao atualizar conta: ' + err.message);
      throw err;
    }
  };

  const deleteConta = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const contasFilhas = planoContas.filter(c => c.conta_pai_id === id);
      if (contasFilhas.length > 0) {
        throw new Error('Não é possível deletar uma conta que possui subcontas.');
      }

      const { error } = await supabase
        .from('planos_contas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      setPlanoContas(planoContas.filter(c => c.id !== id));
      toast.success('✅ Conta deletada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao deletar conta:', err);
      toast.error('Erro ao deletar conta: ' + err.message);
      throw err;
    }
  };

  const getContaById = (id: string) => {
    return planoContas.find(c => c.id === id);
  };

  const getContasByTipo = (tipo: PlanoConta['tipo']) => {
    return planoContas.filter(c => c.tipo === tipo && c.ativo);
  };

  const getContasPrincipais = () => {
    return planoContas.filter(c => !c.conta_pai_id);
  };

  const getSubcontas = (contaPaiId: string) => {
    return planoContas.filter(c => c.conta_pai_id === contaPaiId);
  };

  const buildTree = () => {
    const tree: any[] = [];
    const map = new Map();

    planoContas.forEach(conta => {
      map.set(conta.id, { ...conta, filhos: [] });
    });

    planoContas.forEach(conta => {
      if (conta.conta_pai_id) {
        const pai = map.get(conta.conta_pai_id);
        if (pai) {
          pai.filhos.push(map.get(conta.id));
        }
      } else {
        tree.push(map.get(conta.id));
      }
    });

    return tree;
  };

  useEffect(() => {
    if (user) {
      fetchPlanoContas();
    }
  }, [user]);

  return {
    planoContas,
    loading,
    createConta,
    updateConta,
    deleteConta,
    getContaById,
    getContasByTipo,
    getContasPrincipais,
    getSubcontas,
    buildTree,
    refetch: fetchPlanoContas,
  };
}
