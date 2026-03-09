# 🔒 PENDÊNCIAS DE SEGURANÇA — CAIXA DE AÇÚCAR

> Itens que dependem de ação externa ou decisão do time para serem resolvidos.
> Última atualização: 2026-03-09T03:00:00Z

---

## Pendências Ativas

| # | Severidade | Item | Responsável | Status | Observação |
|---|-----------|------|-------------|--------|------------|
| 1 | 🔴 Crítica | Remover método `signUp` do AuthContext | Dev | ✅ Resolvido | Corrigido em 2026-03-08 |
| 2 | 🔴 Crítica | Limpar ~247 `console.log` com dados sensíveis | Dev | ✅ Resolvido | Corrigido em 2026-03-09 (Auditoria #2 — limpeza real executada) |
| 3 | 🟡 Média | Adicionar rate limiting na Edge Function `criar-usuario` | Dev/Infra | 🔲 Pendente | Sem throttle atual |
| 4 | 🟡 Média | Adicionar políticas INSERT/UPDATE/DELETE em `tags_encomendas` | Dev | ✅ Resolvido | Políticas já existem + interface implementada |
| 5 | 🟡 Média | Criar rota `/auth/reset-password` | Dev | ✅ Resolvido | Corrigido em 2026-03-09 |
| 6 | 🟡 Baixa | Customizar templates de email do Cloud | Admin/Infra | 🔲 Pendente | Emails usam template padrão |
| 7 | 🟡 Baixa | Substituir OG Image por URL permanente | Dev | ✅ Resolvido | Corrigido em 2026-03-09 (Auditoria #2 — imagem local `public/og-image.png`) |
| 8 | 🟡 Média | PlanoGuard enforcement server-side | Dev | ✅ Resolvido | Função `user_has_financial_access` + RLS em 12 tabelas |
| 9 | 🟡 Média | Vulnerabilidade xlsx (Prototype Pollution/ReDoS) | Dev | ⚠️ Sem fix | v0.19.3 só disponível no SheetJS Pro (pago); uso apenas para export |
| 10 | 🟡 Média | Leaked Password Protection desabilitado | Admin | 🔲 Pendente | Requer configuração manual no backend: Auth → Settings → Enable HaveIBeenPwned |
| 11 | 🟡 Baixa | Loading splash usa path de `public/` | Dev | ✅ Resolvido | Logo copiada para `public/umbrella-logo-dourado.png`; index.html atualizado |
| 12 | 🟡 Baixa | `twitter:site` apontava para `@lovable_dev` | Dev | ✅ Resolvido | Tag removida do index.html |
| 13 | 🟡 Baixa | Sem tag `<noscript>` | Dev | ✅ Resolvido | Adicionada em index.html |

---

## Pendências Resolvidas (Histórico)

| Data (UTC) | Item | Resolução |
|------------|------|-----------|
| 2026-03-08 | Loop infinito no AuthContext (`toast` nas deps) | Removido `toast` do array de dependências do `useEffect` |
| 2026-03-09 | Rota `/auth/reset-password` inexistente | Criado `src/pages/auth/ResetPassword.tsx` com validação de token, formulário com `validarSenhaForte`, chamada `updateUser`, toast + redirect. Rota pública adicionada ao App.tsx. |
| 2026-03-09 | console.log com dados sensíveis (~247 ocorrências) | Removidos todos os console.log de debug; console.error sanitizados com formato `[Módulo] Erro: error.message` |
| 2026-03-09 | Políticas RLS INSERT/UPDATE/DELETE em `tags_encomendas` | Políticas já existiam no banco; implementada interface completa para usuários gerenciarem tags personalizadas |
| 2026-03-09 | OG Image URL temporária | Imagem gerada em `public/og-image.png`; meta tags `og:image` e `twitter:image` usando path local `/og-image.png` |
| 2026-03-09 | PlanoGuard client-side only (CLIENT_SIDE_AUTH) | Criada função DB `user_has_financial_access()` (SECURITY DEFINER) + 12 políticas RLS RESTRICTIVE nas tabelas financeiras |
| 2026-03-09 | twitter:site @lovable_dev | Tag `twitter:site` removida do index.html |
| 2026-03-09 | Loading splash path `/src/assets/` | Logo copiada para `public/umbrella-logo-dourado.png`; `index.html` atualizado com path `/umbrella-logo-dourado.png` |
| 2026-03-09 | Sem `<noscript>` fallback | Tag `<noscript>` adicionada ao `index.html` com mensagem em português |

---

*Mantido por Lovable AI — Umbrella Doce | Ká Simas*
