# 🔒 PENDÊNCIAS DE SEGURANÇA — CAIXA DE AÇÚCAR

> Itens que dependem de ação externa ou decisão do time para serem resolvidos.
> Última atualização: 2026-03-08T00:00:00Z

---

## Pendências Ativas

| # | Severidade | Item | Responsável | Status | Observação |
|---|-----------|------|-------------|--------|------------|
| 1 | 🔴 Crítica | Remover método `signUp` do AuthContext | Dev | 🔲 Pendente | Brecha de autocadastro programático |
| 2 | 🔴 Crítica | Limpar ~247 `console.log` com dados sensíveis | Dev | 🔲 Pendente | Dados de clientes/financeiro expostos no console |
| 3 | 🟡 Média | Adicionar rate limiting na Edge Function `criar-usuario` | Dev/Infra | 🔲 Pendente | Sem throttle atual |
| 4 | 🟡 Média | Adicionar políticas INSERT/UPDATE/DELETE em `tags_encomendas` | Dev | 🔲 Pendente | Usuários não conseguem gerenciar tags |
| 5 | 🟡 Média | Criar rota `/auth/reset-password` | Dev | 🔲 Pendente | Link de reset de senha leva a 404 |
| 6 | 🟡 Baixa | Customizar templates de email do Cloud | Admin/Infra | 🔲 Pendente | Emails usam template padrão |
| 7 | 🟡 Baixa | Substituir OG Image por URL permanente | Dev | 🔲 Pendente | URL com expiração |

---

## Pendências Resolvidas (Histórico)

| Data (UTC) | Item | Resolução |
|------------|------|-----------|
| 2026-03-08 | Loop infinito no AuthContext (`toast` nas deps) | Removido `toast` do array de dependências do `useEffect` |

---

*Mantido por Lovable AI — Umbrella Doce | Ká Simas*
