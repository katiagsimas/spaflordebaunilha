import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";

interface IngredienteReceita {
  id: string;
  ingredienteId: string;
  ingrediente: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface EmbalagemReceita {
  id: string;
  embalagemId: string;
  embalagem: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

export interface Receita {
  id: string;
  nome: string;
  categoria?: string;
  tipo?: "produto_avulso" | "produto_combo";
  cardapio?: "ativo" | "fora";
  tempoPreparo: number;
  unidadeTempo: "minutos" | "horas";
  rendimento: number;
  unidadeRendimento: string;
  ingredientes: IngredienteReceita[];
  embalagens?: EmbalagemReceita[];
  custoTotal: number;
  valorVenda?: number;
  despesasVenda?: Array<{ id: string; nome: string; percentual: number; valor: number }>;
  modoPreparo?: string;
  imagens?: string[];
}

async function fetchReceitas(activeGroupId: string) {
  // 1. Buscar todas as receitas em uma única query (filtro explícito por grupo)
  const { data: receitasData, error: receitasError } = await supabase
    .from("receitas")
    .select("*")
    .eq("owner_group_id", activeGroupId)
    .order("nome");


  if (receitasError) throw receitasError;
  if (!receitasData || receitasData.length === 0) return [];

  // 2. Extrair todos os IDs
  const receitasIds = receitasData.map((r) => r.id);

  // 3. Single Promise.all com 4 queries usando .in()
  const [ingredientesRes, embalagensRes, despesasRes, imagensRes] = await Promise.all([
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
      .from("receitas_imagens")
      .select("*")
      .in("receita_id", receitasIds)
      .order("ordem"),
  ]);

  // 4. Verificar erros
  if (ingredientesRes.error) throw ingredientesRes.error;
  if (embalagensRes.error) throw embalagensRes.error;
  if (despesasRes.error) throw despesasRes.error;
  if (imagensRes.error) throw imagensRes.error;

  // 5. Map síncrono em memória filtrando os arrays já carregados
  const receitas: Receita[] = receitasData.map((receita) => {
    const ingredientes: IngredienteReceita[] = (ingredientesRes.data || [])
      .filter((ing) => ing.receita_id === receita.id)
      .map((ing) => ({
        id: ing.id,
        ingredienteId: ing.ingrediente_id,
        ingrediente: ing.ingrediente,
        marca: ing.marca || "",
        qtdeEmbalagem: Number(ing.qtde_embalagem),
        unidadeMedida: ing.unidade_medida,
        precoEmbalagem: Number(ing.preco_embalagem),
        quantidadeUtilizada: Number(ing.quantidade_utilizada),
        custoUnitario: Number(ing.custo_unitario),
        custoReceita: Number(ing.custo_receita),
      }));

    const embalagens: EmbalagemReceita[] = (embalagensRes.data || [])
      .filter((emb) => emb.receita_id === receita.id)
      .map((emb) => ({
        id: emb.id,
        embalagemId: emb.embalagem_id,
        embalagem: emb.embalagem,
        marca: emb.marca || "",
        qtdeEmbalagem: Number(emb.qtde_embalagem),
        unidadeMedida: emb.unidade_medida,
        precoEmbalagem: Number(emb.preco_embalagem),
        quantidadeUtilizada: Number(emb.quantidade_utilizada),
        custoUnitario: Number(emb.custo_unitario),
        custoReceita: Number(emb.custo_receita),
      }));

    const despesasVenda = (despesasRes.data || [])
      .filter((desp) => desp.receita_id === receita.id)
      .map((desp) => ({
        id: desp.despesa_id,
        nome: desp.nome,
        percentual: Number(desp.percentual),
        valor: Number(desp.valor),
      }));

    const imagens = (imagensRes.data || [])
      .filter((img) => img.receita_id === receita.id)
      .map((img) => img.url);

    return {
      id: receita.id,
      nome: receita.nome,
      categoria: receita.categoria || undefined,
      tipo: (receita.tipo as "produto_avulso" | "produto_combo") || undefined,
      cardapio: (receita.cardapio as "ativo" | "fora") || "ativo",
      tempoPreparo: Number(receita.tempo_preparo),
      unidadeTempo: receita.unidade_tempo as "minutos" | "horas",
      rendimento: Number(receita.rendimento),
      unidadeRendimento: receita.unidade_rendimento,
      ingredientes,
      embalagens,
      custoTotal: Number(receita.custo_total),
      valorVenda: receita.valor_venda ? Number(receita.valor_venda) : undefined,
      despesasVenda,
      modoPreparo: receita.modo_preparo || undefined,
      imagens,
    };
  });

  return receitas;
}

export function useReceitas() {
  const { data: receitas = [], isLoading, error, refetch } = useQuery({
    queryKey: ["receitas"],
    queryFn: fetchReceitas,
  });

  // Retornar apenas receitas ativas
  const receitasAtivas = receitas.filter((receita) => receita.cardapio === "ativo");

  return {
    receitas: receitasAtivas,
    todasReceitas: receitas,
    isLoading,
    error,
    refetch,
  };
}
