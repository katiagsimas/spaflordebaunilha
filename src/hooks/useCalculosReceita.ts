import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "./useUserId";
import { useMaoObraPerfis } from "./useMaoObraPerfis";
import { useUserProfile } from "./useUserProfile";

export interface ResumoReceita {
  receitaId: string;
  nome: string;
  categoria: string | null;
  cardapio: string | null;
  valorVenda: number;
  rendimento: number;
  unidadeRendimento: string;
  tempoPreparo: number;
  unidadeTempo: string;
  custoInsumos: number;
  custoEmbalagens: number;
  custoMaoObra: number;
  despesasVenda: number;
  custosProducao: number;
  cmvReal: number;
  cmvRealPercent: number;
  margemReais: number;
  margemPercent: number;
  lucro: number;
  precoVendaManual: number;
  alertas: string;
}

export function useCalculosReceita() {
  const userId = useUserId();
  const { perfis } = useMaoObraPerfis();
  const { profile } = useUserProfile();

  const perfilPadrao = perfis.find((p) => p.padrao && p.ativo);

  const { data: resumos = [], isLoading } = useQuery({
    queryKey: ["calculos_receitas", userId, perfis, perfilPadrao?.valor_hora],
    queryFn: async () => {
      if (!userId) return [];

      // Buscar todas as receitas do usuário
      const { data: receitas, error: receitasError } = await supabase
        .from("receitas")
        .select("*")
        .eq("usuario_id", userId);

      if (receitasError) throw receitasError;
      if (!receitas) return [];

      // Buscar insumos, embalagens, despesas e mãos de obra de todas as receitas
      const receitasIds = receitas.map((r) => r.id);

      const [ingredientesRes, embalagensRes, despesasRes, maosObraRes] = await Promise.all([
        supabase
          .from("receitas_ingredientes")
          .select("*")
          .in("receita_id", receitasIds),
        supabase
          .from("receitas_embalagens")
          .select("*")
          .in("receita_id", receitasIds),
        supabase
          .from("receitas_despesas_venda")
          .select("*")
          .in("receita_id", receitasIds),
        supabase
          .from("receitas_mao_obra")
          .select("*")
          .in("receita_id", receitasIds),
      ]);

      if (ingredientesRes.error) throw ingredientesRes.error;
      if (embalagensRes.error) throw embalagensRes.error;
      if (despesasRes.error) throw despesasRes.error;
      if (maosObraRes.error) throw maosObraRes.error;

      // Calcular resumo para cada receita
      const resumos: ResumoReceita[] = receitas.map((receita) => {
        // 3.1 Custo de Insumos
        const ingredientes = ingredientesRes.data?.filter(
          (i) => i.receita_id === receita.id
        ) || [];
        const custoInsumos = ingredientes.reduce(
          (sum, i) => sum + (i.custo_receita || 0),
          0
        );

        // 3.2 Custo de Embalagens
        const embalagens = embalagensRes.data?.filter(
          (e) => e.receita_id === receita.id
        ) || [];
        const custoEmbalagens = embalagens.reduce(
          (sum, e) => sum + (e.custo_receita || 0),
          0
        );

        // 3.3 Custo de Mão de Obra Direta (NOVO SISTEMA)
        const maosObra = maosObraRes.data?.filter(
          (mo) => mo.receita_id === receita.id
        ) || [];
        
        const custoMaoObra = maosObra.reduce((sum, mo) => {
          let valorHora: number;
          if (mo.usar_valor_padrao) {
            valorHora = perfilPadrao?.valor_hora || 0;
          } else if (mo.perfil_id) {
            const perfil = perfis.find((p) => p.id === mo.perfil_id);
            valorHora = perfil?.valor_hora || 0;
          } else {
            valorHora = 0;
          }
          return sum + (valorHora * mo.horas);
        }, 0);

        // 3.4 Despesas de Venda
        const despesas = despesasRes.data?.filter(
          (d) => d.receita_id === receita.id
        ) || [];
        const despesasVenda = despesas.reduce((sum, d) => {
          // Se for percentual, calcular sobre o valor de venda
          const valorDespesa = d.percentual
            ? (d.percentual / 100) * (receita.valor_venda || 0)
            : d.valor || 0;
          return sum + valorDespesa;
        }, 0);

        // 3.5 Custos de Produção
        const custosProducao = custoInsumos + custoEmbalagens + custoMaoObra;

        // 3.6 CMV Real (R$)
        const cmvReal = custosProducao + despesasVenda;

        // 3.7 % CMV Real
        const cmvRealPercent = receita.valor_venda
          ? (cmvReal / receita.valor_venda) * 100
          : 0;

        // 3.8 Margem em R$
        const margemReais = (receita.valor_venda || 0) - cmvReal;

        // 3.9 Margem %
        const margemPercent = receita.valor_venda
          ? (margemReais / receita.valor_venda) * 100
          : 0;

        // 3.10 Lucro
        const lucro = margemReais;

        // 3.11 Alertas
        const alertas: string[] = [];

        if (cmvRealPercent <= 35) {
          alertas.push("CMV Excelente");
        } else if (cmvRealPercent <= 45) {
          alertas.push("CMV Aceitável");
        } else if (cmvRealPercent <= 55) {
          alertas.push("CMV em Atenção");
        } else {
          alertas.push("CMV Muito Alto");
        }

        if (margemPercent < 30) {
          alertas.push("Margem Baixa");
        }

        if (cmvReal > (receita.valor_venda || 0)) {
          alertas.push("Prejuízo / produto sem lucro");
        }

        return {
          receitaId: receita.id,
          nome: receita.nome,
          categoria: receita.categoria,
          cardapio: receita.cardapio,
          valorVenda: receita.valor_venda || 0,
          rendimento: receita.rendimento,
          unidadeRendimento: receita.unidade_rendimento,
          tempoPreparo: receita.tempo_preparo,
          unidadeTempo: receita.unidade_tempo,
          custoInsumos,
          custoEmbalagens,
          custoMaoObra,
          despesasVenda,
          custosProducao,
          cmvReal,
          cmvRealPercent,
          margemReais,
          margemPercent,
          lucro,
          precoVendaManual: (receita as any).preco_venda || 0,
          alertas: alertas.join(" | "),
        };
      });

      return resumos;
    },
    enabled: !!userId,
  });

  return {
    resumos,
    isLoading,
  };
}
