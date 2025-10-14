import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  unidadeRendimento: "gramas" | "unidades";
  ingredientes: IngredienteReceita[];
  embalagens?: EmbalagemReceita[];
  custoTotal: number;
  valorVenda?: number;
  despesasVenda?: Array<{ id: string; nome: string; percentual: number; valor: number }>;
}

export function useReceitas() {
  const [receitas] = useLocalStorage<Receita[]>("receitas", []);
  
  // Retornar apenas receitas ativas
  const receitasAtivas = receitas.filter(receita => receita.cardapio === "ativo");
  
  return {
    receitas: receitasAtivas,
    todasReceitas: receitas,
  };
}