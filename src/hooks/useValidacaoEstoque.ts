import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ItemFaltante {
  ingrediente: string;
  necessario: number;
  disponivel: number;
  faltam: number;
  unidade: string;
}

interface ValidacaoEstoqueResult {
  tem_estoque: boolean;
  itens_faltantes: ItemFaltante[];
}

interface UseValidacaoEstoqueParams {
  receitaId?: string;
  quantidade: number;
  enabled?: boolean;
}

export function useValidacaoEstoque({ 
  receitaId, 
  quantidade, 
  enabled = true 
}: UseValidacaoEstoqueParams) {
  return useQuery<ValidacaoEstoqueResult>({
    queryKey: ['validacao-estoque', receitaId, quantidade],
    queryFn: async () => {
      if (!receitaId) {
        return { tem_estoque: true, itens_faltantes: [] };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('validar_estoque_receita', {
        p_receita_id: receitaId,
        p_quantidade: quantidade,
        p_usuario_id: user.id,
      });

      if (error) {
        console.error('Erro ao validar estoque:', error);
        toast.error('Erro ao validar estoque');
        throw error;
      }

      // A function retorna um array com um único objeto
      const resultado = data?.[0] || { tem_estoque: true, itens_faltantes: [] };
      
      // Parse dos itens faltantes do JSON
      const itensFaltantes = Array.isArray(resultado.itens_faltantes)
        ? resultado.itens_faltantes.map((item: any) => ({
            ingrediente: item.ingrediente || '',
            necessario: parseFloat(item.necessario) || 0,
            disponivel: parseFloat(item.disponivel) || 0,
            faltam: parseFloat(item.faltam) || 0,
            unidade: item.unidade || '',
          }))
        : [];
      
      return {
        tem_estoque: resultado.tem_estoque,
        itens_faltantes: itensFaltantes,
      };
    },
    enabled: enabled && !!receitaId && quantidade > 0,
    staleTime: 30000, // 30 segundos
    retry: 1,
  });
}
