/**
 * Logger global de erros — registra no console.error com contexto
 * (usuário, rota, timestamp, user-agent) para facilitar debugging
 * até que uma ferramenta como Sentry seja configurada.
 *
 * Substituir por integração com Sentry/LogRocket quando disponível.
 */
import { supabase } from "@/integrations/supabase/client";
import { capturarErroNoSentry } from "@/lib/sentry";

type ErrorContext = {
  origem: string;
  rota: string;
  timestamp: string;
  userAgent: string;
  usuarioId: string | null;
  usuarioEmail: string | null;
  extra?: Record<string, unknown>;
};

let cachedUser: { id: string | null; email: string | null } = {
  id: null,
  email: null,
};

async function carregarUsuarioAtual() {
  try {
    const { data } = await supabase.auth.getSession();
    cachedUser = {
      id: data.session?.user?.id ?? null,
      email: data.session?.user?.email ?? null,
    };
  } catch {
    // silencioso — não queremos que o logger gere novos erros
  }
}

function montarContexto(origem: string, extra?: Record<string, unknown>): ErrorContext {
  return {
    origem,
    rota: typeof window !== "undefined" ? window.location.pathname + window.location.search : "ssr",
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    usuarioId: cachedUser.id,
    usuarioEmail: cachedUser.email,
    extra,
  };
}

export function logarErro(origem: string, erro: unknown, extra?: Record<string, unknown>) {
  const contexto = montarContexto(origem, extra);
  // eslint-disable-next-line no-console
  console.error(`[ErrorLogger] ${origem}`, {
    erro,
    mensagem: erro instanceof Error ? erro.message : String(erro),
    stack: erro instanceof Error ? erro.stack : undefined,
    contexto,
  });
  // Encaminha para Sentry (no-op se VITE_SENTRY_DSN não estiver configurado)
  capturarErroNoSentry(origem, erro, { ...contexto, ...(extra ?? {}) });
}

/**
 * Inicializa os handlers globais (window.onerror e unhandledrejection).
 * Deve ser chamado uma única vez no bootstrap da aplicação.
 */
export function inicializarErrorLogger() {
  if (typeof window === "undefined") return;

  // Mantém usuário atual em cache para enriquecer logs
  carregarUsuarioAtual();
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = {
      id: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
    };
  });

  window.addEventListener("error", (event) => {
    logarErro("window.error", event.error ?? event.message, {
      arquivo: event.filename,
      linha: event.lineno,
      coluna: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logarErro("unhandledrejection", event.reason);
  });
}
