# Integração SSO — Caixa de Açúcar ↔ Planejamento DOCE

**Última atualização:** 2026-05-26 UTC

## Visão geral

Permite que usuárias com plano Business (`negocio`) ou Aluna Imersão (`aluna_imersao`) abram o app **Planejamento Estratégico DOCE** (planejamento.umbrelladoce.com.br) já autenticadas, a partir do Dashboard da Caixa. Também recebe usuárias de volta do DOCE para a Caixa via link mágico do Supabase.

## Componentes

| Camada | Arquivo | Função |
|---|---|---|
| Tabela | `public.sso_token_log` | Anti-replay de `jti` (saída/entrada), TTL via cron diário 03:00 UTC |
| Edge Function (saída) | `supabase/functions/gerar-token-sso-doce/index.ts` | Valida JWT, gera JWT HS256 (5min) com `email`, `nome`, `cpf`, `plano`, `fonte: "caixa"`, `jti`, registra em log e devolve `redirect_url` |
| Edge Function (entrada) | `supabase/functions/validar-token-retorno-doce/index.ts` | Verifica HMAC, anti-replay, gera magic link via `admin.generateLink` |
| Hook FE | `src/hooks/useOpenPlannerDoce.ts` | Encapsula `supabase.functions.invoke('gerar-token-sso-doce')` + redirect |
| UI FE | Card "Planejamento DOCE" em `src/pages/Dashboard.tsx` | Botão acessível, exibido apenas para `negocio` / `aluna_imersao` |
| Rota pública | `/sso-return` → `src/pages/SSOReturnPage.tsx` | Recebe `?token=` do DOCE, valida e segue para magic link |

## Segredos exigidos

- `SSO_SHARED_SECRET` — chave HMAC compartilhada com o DOCE
- `DOCE_BASE_URL` — ex.: `https://planejamento.umbrelladoce.com.br`
- `SUPABASE_SERVICE_ROLE_KEY` — nativo

## Controle de plano

Mostra o card só para planos com Planejamento (Business / Aluna Imersão). Plano `base` (Lite) **não vê** o botão. Vide `src/hooks/usePlano.ts`.

## Status

- ✅ Migração `sso_token_log` aplicada
- ✅ Cron `cleanup_expired_sso_tokens` 03:00 UTC
- ✅ Edge `gerar-token-sso-doce` deployada
- ✅ Edge `validar-token-retorno-doce` deployada
- ✅ Rota pública `/sso-return`
- ✅ Card "Planejamento DOCE" no Dashboard + hook `useOpenPlannerDoce`
