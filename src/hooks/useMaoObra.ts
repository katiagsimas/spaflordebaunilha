import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MaoDeObra {
  id: string;
  user_id: string;
  nome: string;
  valor_hora: number;
  descricao?: string;
  cor: string;
  ativo: boolean;
  padrao: boolean;
  created_at: string;
  updated_at: string;
  ultima_alteracao?: string;
  versao?: number;
}

export interface MaoObraHistorico {
  id: string;
  mao_obra_id: string;
  user_id: string;
  valor_anterior?: number;
  valor_novo: number;
  nome_anterior?: string;
  nome_novo?: string;
  descricao_anterior?: string;
  descricao_novo?: string;
  tipo_alteracao?: string;
  descricao_alteracao?: string;
  data_alteracao: string;
  created_at: string;
}

export function useMaoObra() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: valores = [], isLoading } = useQuery({
    queryKey: ["mao-obra", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("configuracao_mao_obra")
        .select("*")
        .eq("user_id", user.id)
        .order("padrao", { ascending: false })
        .order("nome");

      if (error) throw error;
      return data as MaoDeObra[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<MaoDeObra, "id" | "user_id" | "created_at" | "updated_at" | "ultima_alteracao" | "versao">) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Se está marcando como padrão, remove o padrão dos outros
      if (data.padrao) {
        await supabase
          .from("configuracao_mao_obra")
          .update({ padrao: false })
          .eq("user_id", user.id);
      }

      const { data: newData, error } = await supabase
        .from("configuracao_mao_obra")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("mao_obra_historico").insert({
        mao_obra_id: newData.id,
        user_id: user.id,
        valor_novo: data.valor_hora,
        nome_novo: data.nome,
        descricao_novo: data.descricao,
        tipo_alteracao: "criacao",
        descricao_alteracao: `Valor de mão de obra "${data.nome}" criado com R$ ${data.valor_hora.toFixed(2)}/hora`,
      });

      return newData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Sucesso!",
        description: "Valor de mão de obra cadastrado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MaoDeObra> & { id: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Buscar dados atuais
      const { data: current } = await supabase
        .from("configuracao_mao_obra")
        .select("*")
        .eq("id", id)
        .single();

      if (!current) throw new Error("Registro não encontrado");

      // Se está marcando como padrão, remove o padrão dos outros
      if (data.padrao) {
        await supabase
          .from("configuracao_mao_obra")
          .update({ padrao: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { data: updatedData, error } = await supabase
        .from("configuracao_mao_obra")
        .update({
          ...data,
          versao: (current.versao || 1) + 1,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Gerar descrição das alterações
      const mudancas = [];
      if (data.valor_hora && current.valor_hora !== data.valor_hora) {
        const diff = data.valor_hora - current.valor_hora;
        const percentual = ((diff / current.valor_hora) * 100).toFixed(1);
        mudancas.push(
          `Valor alterado de R$ ${current.valor_hora.toFixed(2)} para R$ ${data.valor_hora.toFixed(2)} (${diff > 0 ? '+' : ''}${percentual}%)`
        );
      }
      if (data.nome && current.nome !== data.nome) {
        mudancas.push(`Nome alterado de "${current.nome}" para "${data.nome}"`);
      }

      // Registrar no histórico
      await supabase.from("mao_obra_historico").insert({
        mao_obra_id: id,
        user_id: user.id,
        valor_anterior: current.valor_hora,
        valor_novo: data.valor_hora || current.valor_hora,
        nome_anterior: current.nome,
        nome_novo: data.nome || current.nome,
        descricao_anterior: current.descricao,
        descricao_novo: data.descricao,
        tipo_alteracao: "edicao",
        descricao_alteracao: mudancas.join(". ") || "Dados atualizados",
      });

      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Atualizado!",
        description: "Valor de mão de obra atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Verificar se está em uso
      const { count } = await supabase
        .from("receitas")
        .select("id", { count: "exact", head: true })
        .eq("tipo_mao_obra_id", id);

      if (count && count > 0) {
        throw new Error(`Este valor está sendo usado em ${count} receita(s). Desative ao invés de excluir.`);
      }

      const { error } = await supabase
        .from("configuracao_mao_obra")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Excluído!",
        description: "Valor de mão de obra excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Buscar dados atuais
      const { data: current } = await supabase
        .from("configuracao_mao_obra")
        .select("*")
        .eq("id", id)
        .single();

      if (!current) throw new Error("Registro não encontrado");

      const { error } = await supabase
        .from("configuracao_mao_obra")
        .update({ ativo: !ativo })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("mao_obra_historico").insert({
        mao_obra_id: id,
        user_id: user.id,
        valor_anterior: current.valor_hora,
        valor_novo: current.valor_hora,
        nome_anterior: current.nome,
        nome_novo: current.nome,
        tipo_alteracao: ativo ? "desativacao" : "reativacao",
        descricao_alteracao: ativo ? "Valor desativado" : "Valor reativado",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mao-obra"] });
      toast({
        title: "Atualizado!",
        description: "Status alterado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: historico = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ["mao-obra-historico"],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("mao_obra_historico")
        .select("*")
        .eq("user_id", user.id)
        .order("data_alteracao", { ascending: false });

      if (error) throw error;
      return data as MaoObraHistorico[];
    },
    enabled: !!user?.id,
  });

  return {
    valores,
    isLoading,
    historico,
    isLoadingHistorico,
    createMaoObra: createMutation.mutate,
    updateMaoObra: updateMutation.mutate,
    deleteMaoObra: deleteMutation.mutate,
    toggleAtivo: toggleAtivoMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingAtivo: toggleAtivoMutation.isPending,
  };
}
