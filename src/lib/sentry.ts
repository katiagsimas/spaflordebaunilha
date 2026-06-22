/**
 * Configuração do Sentry para monitoramento de erros em produção.
 *
 * O DSN é lido da variável de ambiente VITE_SENTRY_DSN.
 * Se não estiver definida, o Sentry NÃO é inicializado (modo silencioso).
 *
 * Filtros de privacidade obrigatórios:
 *  - Mascara campos de formulário sensíveis (senha, token, cartão, etc.)
 *  - Remove cabeçalhos Authorization / cookies / apikey de breadcrumbs
 *  - Remove corpos de resposta do Supabase de breadcrumbs HTTP (podem
 *    conter dados pessoais)
 *  - Filtra dados sensíveis em mensagens de erro antes do envio
 */
import * as Sentry from "@sentry/react";

const SENSITIVE_KEY_REGEX =
  /(password|senha|token|secret|api[_-]?key|apikey|authorization|cookie|card|cartao|cvv|cvc|pin)/i;

const SENSITIVE_VALUE_REGEX =
  /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sk_(live|test)_[A-Za-z0-9]+|pk_(live|test)_[A-Za-z0-9]+|Bearer\s+[A-Za-z0-9._-]+|\b\d{13,19}\b)/g;

function scrub<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") {
    return value.replace(SENSITIVE_VALUE_REGEX, "[Filtered]") as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(scrub) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        out[k] = "[Filtered]";
      } else {
        out[k] = scrub(v);
      }
    }
    return out as unknown as T;
  }
  return value;
}

function isSupabaseUrl(url?: string): boolean {
  if (!url) return false;
  const sb = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return !!sb && url.startsWith(sb);
}

export function inicializarSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // Sem DSN configurado: não inicializa (mantém o app funcionando normalmente).
    return;
  }

  const isProd =
    import.meta.env.MODE === "production" || import.meta.env.PROD === true;

  Sentry.init({
    dsn,
    environment: isProd ? "production" : "development",
    // 100% em produção, 10% em desenvolvimento.
    tracesSampleRate: isProd ? 1.0 : 0.1,
    sampleRate: isProd ? 1.0 : 0.1,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mascarar todo o texto e mídia capturados no Session Replay.
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: isProd ? 0.1 : 0,

    beforeSend(event) {
      // Remove dados sensíveis de request/extra/contexts antes do envio.
      if (event.request) event.request = scrub(event.request);
      if (event.extra) event.extra = scrub(event.extra);
      if (event.contexts) event.contexts = scrub(event.contexts);
      if (event.tags) event.tags = scrub(event.tags);
      if (event.user) {
        // Nunca envia email/ip; apenas id (já é UUID, não-PII direta).
        event.user = { id: event.user.id };
      }
      if (event.message) event.message = scrub(event.message);
      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // Para chamadas HTTP do Supabase, remove o corpo da resposta
      // (pode conter dados pessoais de usuários).
      if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
        const data = breadcrumb.data ?? {};
        if (isSupabaseUrl(data.url as string | undefined)) {
          breadcrumb.data = {
            url: data.url,
            method: data.method,
            status_code: data.status_code,
          };
        } else {
          breadcrumb.data = scrub(data);
        }
      }
      if (breadcrumb.data) breadcrumb.data = scrub(breadcrumb.data);
      return breadcrumb;
    },
  });
}

/**
 * Captura um erro manualmente no Sentry, com contexto adicional já filtrado.
 * Seguro para chamar mesmo quando o Sentry não foi inicializado.
 */
export function capturarErroNoSentry(
  origem: string,
  erro: unknown,
  extra?: Record<string, unknown>,
) {
  try {
    Sentry.withScope((scope) => {
      scope.setTag("origem", origem);
      if (extra) scope.setExtras(scrub(extra));
      if (erro instanceof Error) {
        Sentry.captureException(erro);
      } else {
        Sentry.captureMessage(scrub(String(erro)));
      }
    });
  } catch {
    // nunca quebrar o app por causa do logger
  }
}
