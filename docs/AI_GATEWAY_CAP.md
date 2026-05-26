# 🤖 AI Gateway Cap — Controle de Consumo de IA

> **Status:** ✅ Implementado preventivamente em 26/05/2026 (P-3 da auditoria).
> **Objetivo:** evitar que qualquer feature futura de IA fique exposta a abuso/custos descontrolados.

---

## Arquitetura

```
Frontend (useAi)  →  Edge Function `ai-proxy`  →  Lovable AI Gateway
                          ↓ ↑
                     RPC SECURITY DEFINER
                     (check + record tokens)
                          ↓
                     ai_usage_quotas (RLS)
```

**Camadas de proteção:**

1. **IP rate limit** (in-memory) — 30 req/min por IP. Bloqueia abuso bruto antes mesmo de tocar o banco.
2. **Auth JWT** — `supabase.auth.getClaims()` valida o token.
3. **Conta ativa** — bloqueia se `profiles.ativo = false`.
4. **Cap mensal por plano** — RPC atômica `check_and_increment_ai_quota` (UPSERT com checagem + reversão em corrida).
5. **Whitelist de modelos** — apenas modelos aprovados podem ser solicitados pelo cliente.
6. **Registro de tokens reais** — após resposta, RPC `record_ai_tokens` grava `tokens_in`/`tokens_out`.

---

## Limites por plano

| Plano    | Requisições/mês |
|----------|-----------------|
| Lite (`base`)     | **50**  |
| Business (`negocio`) | **500** |
| MOTHER (admin global) | **ilimitado** (registrado mas sem corte) |

**Para ajustar:** editar a função `public.check_and_increment_ai_quota` (campo `v_limite`).
Os limites foram dimensionados de forma conservadora — revisar com base no consumo real após as primeiras features de IA entrarem em produção.

---

## Como usar no frontend

```ts
import { useAi } from '@/hooks/useAi';

function MeuComponente() {
  const { ask, loading } = useAi();

  const sugerir = async () => {
    const res = await ask([
      { role: 'system', content: 'Você é uma assistente de confeitaria.' },
      { role: 'user', content: 'Sugira um nome criativo para um bolo de chocolate.' },
    ]);
    if (res) console.log(res.text);
  };
}
```

**Não chame `https://ai.gateway.lovable.dev` diretamente do frontend.** A `LOVABLE_API_KEY` é server-side e o cap só é aplicado via `ai-proxy`.

---

## Modelos permitidos

Definidos em `ai-proxy/index.ts` (`ALLOWED_MODELS`):

- `google/gemini-2.5-flash` (default — bom equilíbrio)
- `google/gemini-2.5-flash-lite` (mais barato, para classificação)
- `google/gemini-2.5-pro` (raciocínio complexo)

Adicionar novos modelos exige edição da whitelist.

---

## Schema

```sql
CREATE TABLE public.ai_usage_quotas (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  periodo text,            -- YYYY-MM
  requests_count integer,
  tokens_in bigint,
  tokens_out bigint,
  UNIQUE (user_id, periodo)
);
```

**RLS:**
- Usuário autenticado vê apenas o próprio consumo.
- MOTHER vê todos.
- INSERT/UPDATE/DELETE apenas via service role (sem policy = bloqueado).

**RPCs (SECURITY DEFINER, EXECUTE só para `service_role`):**
- `check_and_increment_ai_quota(user_id, plano_id) → jsonb`
- `record_ai_tokens(user_id, tokens_in, tokens_out) → void`

---

## Códigos de erro do `ai-proxy`

| Status | `error` | Significado |
|--------|---------|-------------|
| 401 | `unauthorized` | Sem JWT válido |
| 403 | `inactive_account` | `profiles.ativo = false` |
| 429 | `ip_rate_limit` | IP excedeu 30 req/min |
| 429 | `monthly_quota_exceeded` | Cota mensal do plano esgotada |
| 429 | `ai_rate_limited` | Lovable AI Gateway 429 |
| 402 | `ai_credits_exhausted` | Workspace sem créditos |
| 400 | `invalid_body` | Body malformado |
| 500 | `ai_not_configured` | `LOVABLE_API_KEY` ausente |

---

## Roadmap

- [ ] Dashboard MOTHER em `/admin/ia-uso` listando top consumidores e tokens por mês.
- [ ] Notificação automática quando usuário atingir 80% da cota.
- [ ] Limites configuráveis por usuário (override do plano) via UI admin.
