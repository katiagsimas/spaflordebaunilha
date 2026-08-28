/**
 * Utilitários de ordenação alfabética (pt-BR, ignorando acentos e maiúsculas).
 */
export function compararTexto(a?: string | null, b?: string | null): number {
  return (a || '').localeCompare(b || '', 'pt-BR', { sensitivity: 'base', numeric: true });
}

export function ordenarAlfabetico<T>(itens: T[], getKey: (item: T) => string | null | undefined): T[] {
  return [...itens].sort((a, b) => compararTexto(getKey(a), getKey(b)));
}
