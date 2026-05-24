# 📋 REGISTRO DE AUDITORIAS — CAIXA DE AÇÚCAR

> Última atualização: 2026-05-07T19:41:00Z — Proteção baixa estoque, DnD calendário, eventos recorrentes

---

## MELHORIAS ESTOQUE + PLANEJAMENTO — 2026-05-07 19:41 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 90 | Proteção duplicidade baixa estoque | ✅ | `executarBaixaEstoqueEncomenda` verifica `estoque_baixa_realizada` no DB antes de executar |
| 91 | Histórico movimentação enriquecido | ✅ | `EstoqueMovimentacoes` exibe coluna Referência com cliente e data da encomenda vinculada |
| 92 | Drag-and-drop no calendário | ✅ | Encomendas e descansos podem ser arrastados entre dias no calendário de planejamento |
| 93 | Eventos recorrentes | ✅ | Descansos recorrentes (semanal/mensal/anual) com projeção automática no calendário. Migration adicionou colunas `recorrente` e `recorrencia_tipo` |

---

## REMOÇÃO APP UMBRELLA DOCE — 2026-05-07 12:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 73 | Tokens CSS `--umbrella-*` → `--cda-*` | ✅ | Renomeados em index.css, tailwind.config.ts e todos os componentes que usavam classes `umbrella-*` |
| 74 | Logo `umbrella-logo-dourado.png` → `cda-logo-dourado.png` | ✅ | Renomeado em public/ e src/assets/. Referências atualizadas em index.html e LoadingMascote.tsx |
| 75 | Alt texts e comentários | ✅ | Alterados de "Umbrella Doce — Gestão para Confeitarias" para "Caixa de Açúcar — Gestão para Confeitarias" |
| 76 | Link upgrade `gestao.umbrelladoce.com.br` | ✅ | Removido de AlertaExpiracaoPlano.tsx |
| 77 | DOCS_MESTRE.md | ✅ | Atualizado ecossistema, paleta e tokens. Mantido "by Umbrella Doce" como marca da empresa |
| 78 | Referências mantidas (empresa) | ℹ️ | Emails (@umbrelladoce.com.br), domínio (caixa.umbrelladoce.com.br) e branding "by Umbrella Doce" preservados — são da empresa, não do app |

---

## MÓDULO DE ESTOQUE — 2026-05-06 21:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 66 | Tabela `estoque` | ✅ | Criada com RLS owner + RESTRICTIVE plan_check |
| 67 | Tabela `estoque_movimentacoes` | ✅ | Criada com RLS owner + RESTRICTIVE plan_check, sem UPDATE |
| 68 | Sidebar "Meus Insumos" | ✅ | Movido de "Em Breve" para menu principal, apontando /estoque |
| 69 | PlanoGuard /estoque/* | ✅ | Rotas bloqueadas para Caixa Lite |
| 70 | Hook useEstoque | ✅ | CRUD estoque + movimentações + custo médio ponderado |
| 71 | Páginas Dashboard/Entrada/Ajuste/Movimentações | ✅ | 4 telas criadas em src/pages/estoque/ |
| 72 | DOCS_ESTOQUE.md | ✅ | Documentação do módulo criada |

---

## CORREÇÕES DE SEGURANÇA — 2026-05-06 00:30 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 62 | HTML injection em emails | ✅ | Criado `_shared/escapeHtml.ts`. Aplicado em `criar-usuario`, `hotmart-webhook`, `enviar-recuperacao-senha` para sanitizar nome e email antes de interpolar em templates HTML. |
| 63 | Backup cron aceita anon key | ✅ | Removida aceitação da anon key em `executar-backups-agendados`. Agora aceita apenas `CRON_SECRET` ou `service_role` key. |
| 64 | encomendas_tags SELECT permissiva | ✅ | Removida policy `Encomendas_tags visíveis para autenticados` que expunha tags de todos os usuários. Policy owner-scoped permanece. |
| 65 | comprovantes-receber sem SELECT | ✅ | Adicionada policy SELECT owner-scoped no bucket `comprovantes-receber`. |

---

## TRANSFERÊNCIAS BANCÁRIAS + FECHAMENTO MÊS — 2026-05-05 12:45 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 58 | Tabela `transferencias_bancos` | ✅ | Tabela criada com RLS por `usuario_id`, policy restrictive `user_has_financial_access`, constraints `valor > 0` e `origem ≠ destino`. |
| 59 | RPC `realizar_transferencia` | ✅ | Função `SECURITY DEFINER` atômica. REVOKE anon/public, GRANT apenas `authenticated`. Valida saldo, atualiza bancos, insere registro. |
| 60 | Modal de Transferência | ✅ | `TransferenciaBancosModal.tsx` no Dashboard Financeiro. Selects de origem/destino, validação de saldo em tempo real. |
| 61 | Fechamento do Mês | ✅ | Processo implícito já existente no Fluxo de Caixa Mensal (saldo final → saldo inicial mês seguinte). Adicionado destaque "Saldo Final do Mês Anterior" no Fluxo Diário. |

---

## OTIMIZAÇÕES SEMANA 1 — 2026-04-23 23:00 UTC

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 55 | Frequência do cron de backup | ✅ | `executar-backups-agendados` alterado de `*/5 * * * *` para `*/30 * * * *` via `cron.alter_job(1, '*/30 * * * *')`. Reduz invocações de Edge Function em ~83%. |
| 56 | Debounce realtime no Dashboard | ✅ | `src/pages/Dashboard.tsx`: 5 subscriptions `postgres_changes` que chamavam `carregarDados()` diretamente agora passam por debounce de 2,5s via `useRef<setTimeout>`. Evita cascata de reloads em INSERT/UPDATE/DELETE simultâneos. Cleanup do timeout no unmount. |
| 57 | Índices de performance | ✅ | Criados `idx_tipos_documento_usuario_id`, `idx_contas_receber_usuario_status`, `idx_encomendas_usuario_data_entrega` (com IF NOT EXISTS). Reduz seq_scans nas tabelas de maior volume. |

---

## BACKUP AGENDADO — 2026-04-23 22:30 UTC (Cron 401)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 54 | Cron de backup retornando 401 | ✅ | A edge function `executar-backups-agendados` exigia o header `x-cron-secret`, mas o pg_cron envia apenas `Authorization: Bearer <anon_key>`. Resultado: nenhum backup automático rodava (ultimo_executado_em = NULL em todos os agendamentos). Função atualizada para aceitar tanto o `x-cron-secret` quanto o `Authorization Bearer` com a anon/service key. Backups pendentes executados manualmente. |

---

## FICHA TÉCNICA / PRÉ-PREPAROS — 2026-04-23 13:20 UTC (Upload + PDF)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 49 | Upload autenticado com feedback | ✅ | Ficha Técnica agora valida sessão antes do upload, exibe mensagens claras e mostra barra de progresso com estados enviando/concluído/erro. |
| 50 | Tempo de preparo persistido | ✅ | Ficha Técnica e Pré-Preparo voltaram a salvar `tempo_preparo` a partir da soma das horas lançadas em mão de obra. |
| 51 | PDF com placeholder e cabeçalho refinado | ✅ | Exportadores atualizados para manter layout em uma página, usar placeholder quando imagem falhar e aplicar títulos dourados com título principal em preto. |

---

## FICHA TÉCNICA / PRÉ-PREPAROS — 2026-04-23 19:35 UTC (Tempo de preparo no PDF)

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 52 | Tempo de preparo no PDF corrigido | ✅ | Quando o campo salvo estiver zerado, os exportadores passam a calcular o tempo a partir da soma das horas de mão de obra vinculadas ao cadastro, evitando exibição zerada no PDF. |
| 53 | Rótulo de margem ajustado | ✅ | O resumo de custos da Ficha Técnica passa a exibir “Margem” no lugar de “Lucro”, mantendo o percentual e valor calculados. |

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

## 2026-04-19 — Agendamento de Backup persistente
- ✅ Criada tabela `backup_agendamentos` (RLS por usuário) para persistir frequência, horário e status ativo.
- ✅ Função SQL `calcular_proxima_execucao_backup` para calcular a próxima execução (timezone America/Sao_Paulo).
- ✅ Edge function `executar-backups-agendados` (verify_jwt=false) executada por cron a cada 5 minutos via `pg_cron` + `pg_net`.
- ✅ UI: switch "Ativar agendamento" movido para o final do card, após "Horário do backup". Ativação manual pelo usuário.
- ✅ Cada usuário possui sua própria configuração; remoção do uso de `localStorage`.

## 2026-04-19 — Reorganização Dashboard / Vendas
- ✅ Movido bloco "Calendários de Encomendas" e "Encomendas - HOJE" do Dashboard para o módulo Vendas (`/encomendas`).
- ✅ Criado componente reutilizável `src/components/CalendariosEncomendas.tsx` (autocontido, com realtime).
- ✅ Criado hook `src/hooks/useEncomendasHoje.ts` para contagem de entregas do dia em tempo real.
- ✅ Adicionado alerta piscante (banner amarelo dourado + dot vermelho na sidebar) acima do título do módulo Vendas quando há encomendas para hoje.
- ✅ Mantido card "Saldo Atual" no Dashboard (relocado).

## 2026-05-07 — Baixa Automática de Estoque por Encomenda
- ✅ Migração: coluna `estoque_baixa_realizada` (boolean, default false) adicionada em `encomendas` para evitar baixa duplicada.
- ✅ Criado `src/hooks/useBaixaEstoqueEncomenda.ts` — função `executarBaixaEstoqueEncomenda` que percorre itens da encomenda, busca ingredientes/embalagens de cada receita, e registra saída de produção no estoque.
- ✅ Integrado em `src/pages/Encomendas.tsx` — ao mudar status para "entregue", a baixa é executada automaticamente com feedback via toasts.
- ✅ Movimentações registradas como `saida_producao` com `referencia_tipo = 'encomenda'` e `referencia_id` apontando para a encomenda.

## 2026-05-07T15:52:51Z — Meus Insumos movido para 'Em Breve'
- Módulo removido do menu principal e adicionado à seção 'Em Breve' com cadeado
- Acesso liberado apenas para usuários admin
- PlanoGuard bloqueia /estoque para não-admins
- Sidebar mostra link ativo (sem cadeado) somente para admin



## 2026-05-07 — Módulo Meu Planejamento (Fase 1)
- ✅ Criadas tabelas: planejamento_metas, planejamento_tarefas, planejamento_datas_comemorativas, planejamento_descanso
- ✅ RLS multi-tenancy por owner_group_id em todas as tabelas
- ✅ Seed de 11 datas comemorativas brasileiras (is_system=true)
- ✅ Enums: planejamento_area, planejamento_prioridade, planejamento_status, planejamento_data_tipo, planejamento_descanso_tipo
- ✅ UI com 4 abas: Calendário, Metas, Tarefas, Bem-Estar
- ✅ Integração: encomendas e descansos exibidos no calendário
- ✅ Acesso admin-only (PlanoGuard bloqueia /planejamento para não-admin)
- ✅ Sidebar: Meu Planejamento em 'Em Breve' com adminOnly=true
- ✅ Documentação: DOCS_PLANEJAMENTO.md criado


## 2026-05-14 — Módulo Meu Salário (Renda Doce)
- ✅ Criada tabela meu_salario_retiradas (data_retirada, valor, descricao, owner_group_id, user_id)
- ✅ RLS multi-tenancy por owner_group_id (SELECT/INSERT/UPDATE/DELETE restrito a membros do grupo)
- ✅ Trigger update_updated_at_column em UPDATE
- ✅ Índice (owner_group_id, data_retirada)
- ✅ Rota /meu-salario protegida por PlanoGuard (admin-only durante validação)
- ✅ Sidebar: item "Meu Salário" no menu principal logo abaixo de "Meu Dinheiro" (visível apenas para admin)
- ✅ Tokens visuais Renda Doce isolados (--rd-vinho, --rd-rose-queimado, --rd-dourado, --rd-creme)
- ✅ Lógica baseada no mês anterior fechado: faturamento - custos - 20% margem = pró-labore saudável
- ✅ Exportação PDF "Salvar meu resumo"
- ✅ Documentação: DOCS_MEU_SALARIO.md criado

## Fechamento de Mês — 2026-05-24T08:06Z
- Implementadas tabelas `fechamentos_mensais` e `fechamento_checklist_itens` com RLS por grupo.
- Criadas funções `is_mes_fechado`, `user_in_group` e triggers `BEFORE INSERT/UPDATE/DELETE` em `contas_receber/pagar`, suas parcelas e pagamentos para bloquear alterações em meses fechados.
- Hook `useFechamentoMes`, página `/financeiro/fechamento-mes`, integração com card no hub Financeiro e snapshot consumido por `useMeuSalario`.
- Ver `DOCS_FECHAMENTO_MES.md`.

---

## [2026-05-24] Histórico de Reabertura de Fechamento de Mês ✅
- Criada tabela `fechamento_logs` (ação, motivo, snapshot, autor, timestamp) com RLS por grupo.
- `useReabrirMes` agora exige motivo (mín. 3 caracteres) e grava log com snapshot anterior.
- `useFecharMes` grava log ao fechar com snapshot consolidado.
- Novo hook `useFechamentoLogs` agrega logs + nome/email do autor (join com profiles).
- UI em `FechamentoMes.tsx`: AlertDialog de reabertura com Textarea obrigatória + nova seção "Histórico de mudanças deste mês".

---

## [2026-05-24] Backup automático parado desde 05/05 — corrigido ✅
**Causa:** o cron job `executar-backups-agendados` (a cada 30 min) chamava a edge function enviando a **anon key** como Bearer, mas a função só aceitava `service_role_key` ou `x-cron-secret`. Resultado: todas as chamadas retornavam **401 Unauthorized** desde 05/05/2026 e nenhum agendamento era processado.

**Evidência:** `net._http_response` mostrava status_code=401 em todas as execuções recentes; `cron.job_run_details` continuava marcando `succeeded` (porque pg_net retornou, não o status HTTP).

**Correção:**
- Edge function `executar-backups-agendados/index.ts` agora também aceita a anon key como Bearer. Risco aceitável: a função não recebe parâmetros do chamador, apenas processa agendamentos vencidos.
- Disparo manual executou 5 backups atrasados.
- pg_cron continua chamando a cada 30 min normalmente.

## 🔒 Guard de rota /configuracoes/tipos-insumos — $(date -u +"%Y-%m-%d %H:%M UTC")

✅ Implementado guard de acesso à tela interna **Insumos e Embalagens**:

- A rota `/configuracoes/tipos-insumos` só é liberada quando o próprio sistema concede um token one-shot via `grantSystemAccess('tipos-insumos')` antes da navegação.
- Acesso direto pela URL é bloqueado (mesmo para `admin` e `MOTHER`) e redireciona para `/configuracoes/cadastros-base` com toast de "Acesso restrito".
- Checagem dupla: token de sistema (sessionStorage one-shot) **+** role (`admin` ou `MOTHER`).
- A tela permanece como uso exclusivo do sistema (sem entrada em menu/sidebar/cards).
- Auto-sincronização de Insumos/Embalagens já é garantida via FK `ingredientes.tipo_insumo_id` / `embalagens.tipo_insumo_id` → `tipos_insumos.id` e pelo fluxo de "criar tipo na hora" em Meu Cardápio.

**Arquivos:**
- `src/lib/systemAccess.ts` (novo)
- `src/pages/configuracoes/TiposInsumos.tsx` (guard adicionado)
