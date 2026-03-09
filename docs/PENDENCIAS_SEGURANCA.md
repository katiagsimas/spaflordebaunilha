# 🔒 PENDÊNCIAS DE SEGURANÇA — CAIXA DE AÇÚCAR

> Itens que dependem de ação externa ou decisão do time para serem resolvidos.
> Última atualização: 2026-03-09T02:00:00Z

---

## Pendências Ativas

| # | Severidade | Item | Responsável | Status | Observação |
|---|-----------|------|-------------|--------|------------|
| 1 | 🔴 Crítica | Remover método `signUp` do AuthContext | Dev | ✅ Resolvido | Corrigido em 2026-03-08 |
| 2 | 🔴 Crítica | Limpar ~247 `console.log` com dados sensíveis | Dev | ✅ Resolvido | Corrigido em 2026-03-09 |
| 3 | 🟡 Média | Adicionar rate limiting na Edge Function `criar-usuario` | Dev/Infra | 🔲 Pendente | Sem throttle atual |
| 4 | 🟡 Média | Adicionar políticas INSERT/UPDATE/DELETE em `tags_encomendas` | Dev | ✅ Resolvido | Políticas já existem + interface implementada |
| 5 | 🟡 Média | Criar rota `/auth/reset-password` | Dev | ✅ Resolvido | Corrigido em 2026-03-09 |
| 6 | 🟡 Baixa | Customizar templates de email do Cloud | Admin/Infra | 🔲 Pendente | Emails usam template padrão |
| 7 | 🟡 Baixa | Substituir OG Image por URL permanente | Dev | ✅ Resolvido | Corrigido em 2026-03-09 |
| 8 | 🟡 Média | PlanoGuard enforcement server-side | Dev | ✅ Resolvido | Função `user_has_financial_access` + RLS em 12 tabelas |
| 9 | 🟡 Média | Vulnerabilidade xlsx (Prototype Pollution/ReDoS) | Dev | ⚠️ Sem fix | v0.19.3 só disponível no SheetJS Pro (pago); uso apenas para export |

---

## Pendências Resolvidas (Histórico)

| Data (UTC) | Item | Resolução |
|------------|------|-----------|
| 2026-03-08 | Loop infinito no AuthContext (`toast` nas deps) | Removido `toast` do array de dependências do `useEffect` |
| 2026-03-09 | Rota `/auth/reset-password` inexistente | Criado `src/pages/auth/ResetPassword.tsx` com validação de token, formulário com `validarSenhaForte`, chamada `updateUser`, toast + redirect. Rota pública adicionada ao App.tsx. |
| 2026-03-09 | console.log com dados sensíveis (~247 ocorrências) | Removidos todos os console.log de debug; console.error sanitizados com formato `[Módulo] Erro: error.message` |
| 2026-03-09 | Políticas RLS INSERT/UPDATE/DELETE em `tags_encomendas` | Políticas já existiam no banco; implementada interface completa para usuários gerenciarem tags personalizadas no ConfiguracaoTagsEncomendas |
| 2026-03-09 | OG Image URL temporária | Imagem movida para `public/og-image.png`; meta tags `og:image` e `twitter:image` atualizadas; tag `twitter:site` removida |
| 2026-03-09 | PlanoGuard client-side only (CLIENT_SIDE_AUTH) | Criada função DB `user_has_financial_access()` (SECURITY DEFINER) + 12 políticas RLS RESTRICTIVE nas tabelas financeiras |

---

*Mantido por Lovable AI — Umbrella Doce | Ká Simas*
