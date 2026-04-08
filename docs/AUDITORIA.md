# 📋 REGISTRO DE AUDITORIAS — CAIXA DE AÇÚCAR

> Última atualização: 2026-04-08T17:15:00Z — Correções de segurança (scan)

---

## SEGURANÇA — 2026-04-08 17:15 UTC (Correções do Security Scan)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Privilege escalation via profiles.plano_id | ✅ | Trigger `protect_plan_fields()` impede usuários não-admin de alterar plano_id, plano_tipo, plano_inicio, plano_fim. |
| 2 | encomendas_tags permissivas | ✅ | Removidas políticas INSERT/DELETE que usavam apenas `auth.role()='authenticated'`. Mantidas políticas ownership-scoped. |
| 3 | tags sem ownership | ✅ | Adicionada coluna `user_id` na tabela `tags`. Políticas substituídas por ownership-scoped. |
| 4 | topo-bolo storage sem ownership | ✅ | Políticas INSERT/DELETE atualizadas para usar `storage.foldername(name)[1] = auth.uid()::text`. |
| 5 | comprovantes-pagar sem UPDATE policy | ✅ | Adicionada política UPDATE com ownership enforcement. |

---

## LIMPEZA — 2026-04-08 13:49 UTC (Remoção de usuários de teste)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Remoção de usuários de teste | ✅ | Usuários removidos via Admin API (auth.users + profiles cascade). Edge function temporária `deletar-usuario` utilizada e removida após uso. |
| 2 | Edge function criar-usuario redeployada | ✅ | Versão atualizada com suporte a planoId, planoTipo, planoExpiraEm deployada e testada. |

---

## CORREÇÃO — 2026-04-07 (Plano e Periodicidade)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Plano sempre vinculado ao Base | ✅ | A edge function `criar-usuario` agora processa corretamente `planoExpiraEm` (mapeado para `plano_fim`) e `planoTipo` (mensal/anual). Adicionada coluna `plano_tipo` em `profiles`. Todos os caminhos (novo, reativação, atualização) agora persistem plano_id, plano_tipo, plano_inicio e plano_fim. |
| 2 | Periodicidade não exibida | ✅ | Sidebar atualizada para exibir "(Mensal)" ou "(Anual)" ao lado do nome do plano. |

---

## CORREÇÃO CRÍTICA — 2026-04-07 (Unidades de Medida)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Criação de usuários falhando | ✅ | Função `criar_unidades_medida_padrao` usava `ON CONFLICT (usuario_id, codigo)` mas não existia unique index correspondente. Adicionado `unidades_medida_usuario_codigo_unique`. Erro no auth: `"no unique or exclusion constraint matching the ON CONFLICT specification"` |

---

## STATUS FINAL: ✅ APROVADO PARA LANÇAMENTO

Todos os itens críticos foram resolvidos. Restam 18 itens de atenção (⚠️) que não bloqueiam lançamento.

---

## AUDITORIA #2 — 2026-03-09

### 📊 Resumo Executivo
- **Status Geral:** ✅ APROVADO PARA LANÇAMENTO
- **Total de itens verificados:** 82
- **Itens OK (✅):** 66
- **Itens de Atenção (⚠️):** 13
- **Itens Críticos (❌):** 0
- **Itens Não Aplicáveis (🔲):** 3

---

### 🔴 Itens Críticos — TODOS RESOLVIDOS

| # | Item | Status | Data Correção |
|---|------|--------|---------------|
| 1 | `signUp` removido do AuthContext | ✅ | 2026-03-08 |
| 2 | ~247 `console.log` com dados sensíveis | ✅ | 2026-03-09 |

---

### 🟡 Itens de Atenção (não bloqueiam lançamento)

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1 | Uso excessivo de `: any` (~1233 ocorrências) | ⚠️ | Tipagem fraca em 62 arquivos |
| 2 | `window.confirm` em 7 arquivos | ⚠️ | Deveria usar ConfirmDialog |
| 3 | Sem lazy loading de rotas (~50 páginas) | ⚠️ | Bundle inicial grande |
| 4 | Sem virtualização em listas longas | ⚠️ | Pode causar lentidão |
| 5 | Sem `sitemap.xml` | ⚠️ | Apenas robots.txt |
| 6 | Emails transacionais não customizados | ⚠️ | Templates padrão do Cloud |
| 7 | Sem analytics ou monitoramento de erros | ⚠️ | Sem GA, Sentry, etc. |
| 8 | Sem testes automatizados | ⚠️ | Nenhum teste unitário/e2e |
| 9 | Componentes grandes sem splitting | ⚠️ | ContasReceber 1171 linhas |
| 10 | Funções de banco redundantes | ⚠️ | `criar_bancos_oficiais_usuario` vs `criar_bancos_padrao_para_usuario` |
| 11 | `pagamentoSchema` inconsistente | ⚠️ | Usado só por DarBaixaDialog, não DarBaixaPagarDialog |
| 12 | Sem tratamento offline | ⚠️ | Nenhuma tela de offline |
| 13 | Imagens `alt` genéricas em PrePreparoForm | ⚠️ | "Preview 1", "Preview 2" |

---

### 🟢 Itens Resolvidos (Histórico Completo)

| Data (UTC) | Item | De | Para | Descrição |
|------------|------|----|------|-----------|
| 2026-03-08 | AuthContext `useEffect` deps | ⚠️ bug | ✅ | Removido `toast` das deps — causava loop infinito |
| 2026-03-08 | `signUp` no AuthContext | ❌ | ✅ | Método removido da interface, implementação e Provider |
| 2026-03-09 | OG Image URL temporária | ⚠️ | ✅ | Imagem em `public/og-image.png`, meta tags com path local |
| 2026-03-09 | Twitter card `@lovable_dev` | ⚠️ | ✅ | Tag `twitter:site` removida do index.html |
| 2026-03-09 | PlanoGuard client-side only | ⚠️ | ✅ | Função `user_has_financial_access` + 12 RLS RESTRICTIVE |
| 2026-03-09 | Rota `/auth/reset-password` inexistente | ⚠️ | ✅ | ResetPassword.tsx com validarSenhaForte + redirect |
| 2026-03-09 | RLS INSERT/UPDATE/DELETE em `tags_encomendas` | ⚠️ | ✅ | Políticas confirmadas + interface implementada |
| 2026-03-09 | ~247 `console.log` com dados sensíveis | ❌ | ✅ | Todos removidos de 13 arquivos |
| 2026-03-09 | Loading splash path `/src/assets/` | ⚠️ | ✅ | Logo em `public/umbrella-logo-dourado.png` |
| 2026-03-09 | Sem `<noscript>` fallback | ⚠️ | ✅ | Tag adicionada ao `<body>` do index.html |
| 2026-03-30 | Imagem de marca da tela de login | 🔄 | ✅ | `src/assets/auth-brand-image.png` substituída por nova arte |

---

## AUDITORIA #1 — 2026-03-08

### 📊 Resumo Executivo
- **Status Geral:** ⚠️ APROVADO COM RESSALVAS
- **Total de itens verificados:** 82
- **Itens OK (✅):** 54
- **Itens de Atenção (⚠️):** 22
- **Itens Críticos (❌):** 2
- **Itens Não Aplicáveis (🔲):** 4

*Detalhes completos da Auditoria #1 disponíveis no histórico Git.*

---

*Auditoria realizada por Lovable AI — Prompt de Auditoria v1.0 — Umbrella Doce | Ká Simas*
