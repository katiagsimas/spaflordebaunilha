import { useEffect, useMemo, useState } from 'react';

/**
 * Paginação client-side reutilizável para listagens.
 */
export function usePaginacao<T>(itens: T[], tamanhoInicial = 25) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState<number>(tamanhoInicial);

  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [totalPaginas, pagina]);

  const itensPagina = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return itens.slice(inicio, inicio + porPagina);
  }, [itens, pagina, porPagina]);

  return {
    pagina,
    setPagina,
    porPagina,
    setPorPagina: (n: number) => {
      setPorPagina(n);
      setPagina(1);
    },
    total,
    totalPaginas,
    itensPagina,
  };
}
