# 📋 REGISTRO DE AUDITORIAS — CAIXA DE AÇÚCAR

> Última atualização: 2026-04-10T21:00:00Z — Remoção periodicidade 7dias do Caixa Start

---

## REFINAMENTO CAIXA START — 2026-04-10 21:00 UTC (Apenas 14 dias)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 46 | Remoção opção 7 dias | ✅ | Webhook, CriarUsuarioDialog e EditarUsuarioDialog atualizados para aceitar apenas 14 dias |
| 47 | Correção usuários existentes | ✅ | Usuário `chefkasimas+teste11@gmail.com` corrigido de 7dias → 14dias (plano_fim ajustado) |
| 48 | Card Start 7d removido | ✅ | Dashboard admin agora exibe apenas card "Start 14d" |

---

## CORREÇÃO WEBHOOK — 2026-04-10 20:30 UTC (Plano Start não detectado)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 42 | Webhook: logging de planName | ✅ | Adicionado log de todas as fontes de nome do plano (plan.name, offer.key, offer.name, offer.code, product.name) |
| 43 | Webhook: detecção ampliada | ✅ | Concatenação de todos os campos disponíveis para maximizar detecção de keywords |
| 44 | Usuário corrigido | ✅ | testecomprador271101postman15@example.com: base/anual → start/14dias |
| 45 | user_has_financial_access | ✅ | Função DB corrigida para incluir plano 'start' (antes só 'negocio') |

---

## NOVO PLANO — 2026-04-10 12:00 UTC (Caixa Start)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 38 | Plano Caixa Start criado | ✅ | Novo plano com acesso completo (igual Business) e periodicidade de 7 ou 14 dias |
| 39 | Webhook Hotmart atualizado | ✅ | Reconhece palavras-chave 'start' e 'caixa start', detecta 14 dias pelo nome |
| 40 | UI Admin atualizada | ✅ | CriarUsuarioDialog, EditarUsuarioDialog e Usuarios.tsx suportam o novo plano |
| 41 | usePlano atualizado | ✅ | Plano 'start' com acesso total (wildcard *) |

---

## REGRA DE NEGÓCIO — 2026-04-09 23:00 UTC (Lite só Anual)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 35 | Caixa Lite somente anual | ✅ | Removida opção mensal para o plano Caixa Lite em todo o sistema: webhook Hotmart, CriarUsuarioDialog, EditarUsuarioDialog, cards de estatísticas do painel admin. |
| 36 | Correção de usuários existentes | ✅ | Usuário `chefkasimas+teste6@gmail.com` corrigido de `mensal` para `anual` com data de expiração recalculada (365 dias). |
| 37 | Limpeza de usuários inativos | ✅ | Removido 1 usuário inativo (`chefkasimas+teste6@gmail.com`) e todos os seus dados: roles, histórico de planos, sessões, perfis de mão de obra, configurações, bancos, categorias, unidades de medida, tipos de documento, tags, plano de contas. Base agora com 0 inativos. |

---

## LIMPEZA — 2026-04-09 22:30 UTC (Remoção de Usuários Inativos e Logs)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 33 | Remoção de 11 usuários inativos | ✅ | Removidos todos os dados: profiles, roles, sessões, histórico de planos, cadastros funcionais (encomendas, financeiro, receitas, pré-preparos, clientes, fornecedores), configurações (bancos, tipos_documento, unidades_medida, plano_contas, categorias, tags, mão de obra, juros, backups). |
| 34 | Limpeza de logs de administração | ✅ | Todos os 44 registros da tabela `admin_logs` foram removidos. Histórico zerado. |

---

## CORREÇÕES — 2026-04-09 21:00 UTC (Renomeação de Planos)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 31 | Plano Base → Caixa Lite | ✅ | Nome atualizado no banco (tabela `planos`), webhook Hotmart, edge function `criar-usuario`, painel admin e fallback do hook `usePlano`. |
| 32 | Plano Negócio → Caixa Business | ✅ | Mesmos pontos do item 31. Webhook mantém retrocompatibilidade com palavras-chave `negocio`, `negócio`, `business` e `caixa business`. |

---

## CORREÇÕES — 2026-04-09 20:13 UTC (Cadastros Financeiros)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 29 | Submódulo Financeiro → Cadastros | ✅ | Submódulo renomeado para `Cadastros`, removido de Configurações e adicionado ao módulo Financeiro com card dedicado no hub principal. |
| 30 | Acesso raiz de Configurações no Caixa Lite | ✅ | Regra de rotas refinada para permitir `/configuracoes` sem liberar subrotas financeiras; rotas antigas agora redirecionam para `/financeiro/cadastros/*`. |

---

## MELHORIAS — 2026-04-09 20:00 UTC (Histórico de Planos)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 25 | Tabela historico_planos | ✅ | Criada tabela para registrar todas as alterações de plano (criação, renovação, upgrade, downgrade, cancelamento). RLS: somente admins. |
| 26 | Campo origem_criacao | ✅ | Adicionado campo `origem_criacao` na tabela profiles (admin/webhook/sistema). Backfill realizado para usuários existentes. |
| 27 | Formulário EditarUsuario | ✅ | Adicionados campos: data criação, origem, periodicidade, data início/fim do plano, e seção de histórico de planos. |
| 28 | Edge Functions — historico | ✅ | `criar-usuario` e `hotmart-webhook` agora registram histórico de planos em todas as operações (criação, cancelamento, SWITCH_PLAN). |

---

## CORREÇÕES — 2026-04-09 19:00 UTC (Plano não salvo + Webhook)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 21 | Trigger protect_plan_fields | ✅ | Trigger bloqueava atualizações de plano feitas por Edge Functions (service role) porque `auth.uid()` era NULL. Corrigido para permitir quando `auth.uid() IS NULL`. |
| 22 | Webhook Hotmart — createUser | ✅ | Substituído `inviteUserByEmail` por `createUser` + email via Resend, alinhando com o fluxo de `criar-usuario`. |
| 23 | Webhook — calcularPlanoFim | ✅ | Corrigido para receber `planoInicio` como parâmetro e calcular fim relativo ao início (não à data atual). |
| 24 | Dados plano retroativos | ✅ | Corrigidos: `negoanual` → negocio/anual/365d, `baseanual` → base/anual/365d. |

---

## CORREÇÕES — 2026-04-09 17:30 UTC (Listagem + Recovery + Primeiro Acesso)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 17 | Datas plano na listagem | ✅ | Adicionado `last_login` à interface UserProfile e à query. Campos `plano_inicio`/`plano_fim` já eram buscados — dados estavam NULL no DB para usuários antigos. |
| 18 | Último Acesso | ✅ | Movido update de `last_login` para AuthContext (evento SIGNED_IN) para capturar todo login, não apenas via Login.tsx. |
| 19 | Email recuperação via Resend | ✅ | Criada Edge Function `enviar-recuperacao-senha` que gera link via `admin.generateLink(recovery)` e envia via Resend (noreply@umbrelladoce.com.br). ForgotPassword.tsx agora chama esta função. |
| 20 | Diálogo duplicado de senha | ✅ | ResetPassword.tsx agora seta `primeiro_acesso: false` após redefinir senha e faz signOut, evitando que o AlterarSenhaObrigatoria apareça no login subsequente. |

---

## MÓDULO USUÁRIOS — 2026-04-09 12:00 UTC (Refinamentos + Resend)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 13 | Formulário Criar Usuário | ✅ | Adicionados campos "Data Início" e "Data Expiração" com auto-cálculo baseado na periodicidade (30/365 dias). |
| 14 | Listagem de usuários | ✅ | Removidas colunas "Confeitaria" e "Cadastrado em". Adicionadas colunas "Início do Plano" e "Expiração do Plano" após Permissões. |
| 15 | Email de boas-vindas Resend | ✅ | Removido inviteUserByEmail (Magic Link nativo). Novo usuário criado via createUser + generateLink. Email de boas-vindas enviado via Resend API (noreply@umbrelladoce.com.br). |
| 16 | Edge function criar-usuario | ✅ | Refatorada para usar Resend em vez de invite nativo. Senha temporária aleatória + magic link gerado para primeiro acesso. |

---

---

## ARQUITETURA — 2026-04-08 21:00 UTC (Desvinculação Umbrella Doce)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 9 | SSO removido | ✅ | Deletados: SSO.tsx, validar-token-sso, gerar-token-retorno. Rota /auth/sso removida. Botão "Voltar Umbrella Doce" removido da sidebar. Secret SSO_SECRET deletado. |
| 10 | Webhook Hotmart criado | ✅ | Edge function `hotmart-webhook` para provisionamento automático. Eventos: PURCHASE_APPROVED/COMPLETE (ativa), CANCELED/REFUNDED/CHARGEBACK/SUBSCRIPTION_CANCELLATION (desativa), SWITCH_PLAN (atualiza plano). Validação via HOTMART_HOTTOK. |
| 11 | criar-usuario simplificado | ✅ | Removida autenticação via x-api-secret (Umbrella Doce). Mantida apenas autenticação via JWT de admin. Adicionado log em admin_logs. |
| 12 | Painel admin: criar usuário | ✅ | Botão "Criar Usuário" adicionado em /admin/usuarios com dialog (email, nome, confeitaria, plano, periodicidade). Envia convite por Magic Link. |

---


## SEGURANÇA — 2026-04-08 20:29 UTC (Scan #3 — Correção policy encomendas)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 8 | Policy SELECT encomendas permissiva | ✅ | Removida policy "Anyone can view order images". Corrigida policy owner-scoped para usar `foldername(name)[1] = auth.uid()`. |

---

## SEGURANÇA — 2026-04-08 17:22 UTC (Scan #2 — Storage encomendas)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 6 | Bucket encomendas público sem ownership | ✅ | Bucket tornado privado. Política SELECT owner-scoped adicionada. Código migrado de getPublicUrl para createSignedUrl. |
| 7 | Realtime messages sem RLS | ⚠️ Ignorado | Schema reservado (realtime) — tabelas subjacentes já possuem RLS owner-scoped. |

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
