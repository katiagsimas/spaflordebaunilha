import { useLocalStorage } from "./useLocalStorage";

export interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
}

const UNIDADES_PADRAO: UnidadeMedida[] = [
  { id: "1", nome: "Unidades", sigla: "un" },
  { id: "2", nome: "Gramas", sigla: "g" },
  { id: "3", nome: "Quilogramas", sigla: "kg" },
  { id: "4", nome: "Mililitros", sigla: "ml" },
  { id: "5", nome: "Litros", sigla: "l" },
  { id: "6", nome: "Centímetros", sigla: "cm" },
  { id: "7", nome: "Metros", sigla: "m" },
];

export function useUnidadesMedida() {
  return useLocalStorage<UnidadeMedida[]>("unidadesMedida", UNIDADES_PADRAO);
}
