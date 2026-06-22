# Módulo Conversa Doce

**Adicionado em:** 2026-05-26
**Origem:** portado do app standalone "Conversa Doce" (projeto separado no workspace)
**Status:** ✅ Ativo

## Visão geral

Assistente premium de respostas para WhatsApp das confeiteiras. A usuária cola a mensagem da cliente, a IA (Gemini 2.5 Flash) gera 3 opções de resposta com tons diferentes (Acolhedora, Estratégica, Encantadora, etc), e ela pode copiar, editar ou favoritar para reutilizar.

## Acesso

- **Plano:** Business (`negocio`). Lite (`base`) é bloqueado pelo `PlanoGuard` → redireciona para `/upgrade`.
- **Role:** apenas usuárias admin/MOTHER veem no sidebar (`adminOnly: true`).
- **Sidebar:** seção `PLANEJAMENTO`.

## Rotas

- `/conversa-doce` — formulário principal (textarea + sugestões + benefícios)
- `/conversa-doce/respostas` — exibe as 3 respostas geradas

## Arquivos

```
src/pages/conversa-doce/
  ConversaDoce.tsx           # Página principal (form)
  ConversaDoceRespostas.tsx  # Resultados da IA
  ResponseCard.tsx           # Card de uma resposta (copiar/editar/favoritar)
  FavoritosSheet.tsx         # Drawer com favoritos do grupo
```

## Backend

- **Edge function:** reutiliza `ai-proxy` (não foi criada nova função).
  - Auth + plano + quota + rate limit já implementados.
  - Modelo: `google/gemini-2.5-flash` (na allowlist do `ai-proxy`).
- **Tabela:** `conversa_doce_favoritos`
  - Campos: `id`, `owner_group_id`, `user_id`, `texto`, `rotulo`, `mensagem_original`, `created_at`, `updated_at`
  - RLS multi-tenant via `user_group_roles`:
    - SELECT/INSERT: qualquer membro ativo do grupo
    - UPDATE/DELETE: criador OU admin do grupo

## Prompt da IA

O system prompt está em `ConversaDoceRespostas.tsx`. Define tom (PT-BR, profissional, sem gírias), restrições (sem desconto fácil, máx 1 emoji, 2-4 linhas) e formato de saída (JSON estrito com `responses[3]`).

## O que NÃO foi portado do app original

- Auth/login/admin/períodos de acesso → Caixa já tem (`AuthContext`, `useGroup`, planos Hotmart)
- Tabela `access_periods`, `app_settings`, edge function `admin-users` → desnecessárias
- `must_change_password` → Caixa tem fluxo próprio (`first-access-flow`)
- Cores oklch hardcoded → migradas para tokens `cda-*` (Vinho Premium)

## Migrations

- `20260526...conversa_doce_favoritos.sql` (criação da tabela + RLS + trigger updated_at)

## Atualização 2026-05-26 — Acesso manual por usuária

Adicionados campos em `profiles`:
- `conversa_doce_ativo` (bool)
- `conversa_doce_inicio` (date)
- `conversa_doce_fim` (date)

Regras:
- Admin-mãe (MOTHER) sempre tem acesso (bypass).
- Demais usuárias: acesso liberado apenas se `conversa_doce_ativo = true` e `conversa_doce_fim >= hoje` (ou nulo, sem expiração).
- Aluna da Imersão: o formulário de edição (admin > usuários) preenche automaticamente o acesso espelhando o período do plano (30 dias).
- Guard de rota: `src/components/ConversaDoceGuard.tsx` substitui `MotherGuard` em `/conversa-doce*`.
- Sidebar: item filtrado via `useConversaDoceAccess()`.
- Histórico (favoritos) é preservado após expiração — sem cascade delete.
