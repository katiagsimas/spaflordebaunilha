/**
 * Constantes e helpers centralizados de planos do Spa Flor de Baunilha.
 */

export const IMERSAO_DIAS_ACESSO = 30;

export const PLANO_LABELS: Record<string, string> = {
  base: "Flor de Baunilha Lite",
  negocio: "Flor de Baunilha Business",
  
  controle: "Plano Controle",
};

export function getPlanoLabel(planoId?: string | null): string {
  if (!planoId) return PLANO_LABELS.base;
  return PLANO_LABELS[planoId] ?? planoId;
}

/** Plano que dá acesso completo aos módulos financeiros (Business). */
export function isFullAccessPlano(planoId?: string | null): boolean {
  return planoId === "negocio";
}
