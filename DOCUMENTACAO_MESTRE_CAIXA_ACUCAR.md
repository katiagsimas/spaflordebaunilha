# 📘 DOCUMENTAÇÃO MESTRE — CAIXA DE AÇÚCAR

**Sistema de Gestão para Confeitarias**
**Atualizada em:** Fevereiro 2026
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)

---

## 1. VISÃO GERAL

### 1.1 O que é
Caixa de Açúcar é um sistema web de gestão completo para confeitarias. Permite controlar encomendas, precificar produtos com fichas técnicas, gerenciar financeiro (contas a pagar/receber, fluxo de caixa, DRE) e administrar clientes, fornecedores e usuários com isolamento multi-tenant por grupos.

### 1.2 Para quem
Confeiteiras, doceiras e pequenas empresas do ramo de confeitaria que precisam de controle profissional do negócio.

### 1.3 Proposta de valor
- Precificação técnica baseada em fichas de ingredientes, embalagens, mão de obra e pré-preparos
- Gestão financeira completa (contas a pagar/receber, fluxo de caixa, DRE)
- Controle de encomendas com status, tags e vinculação financeira
- Cadastro de clientes/fornecedores com alertas de aniversário
- Arquitetura multi-tenant com governança central (MOTHER) e operação por grupos

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Stack
| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado servidor | TanStack React Query v5 |
| Roteamento | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase) |
| Banco de dados | PostgreSQL |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Edge Functions | Deno (Supabase Edge Functions) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| PDF | jsPDF + jspdf-autotable |
| Planilhas | xlsx |
| Drag & Drop | @dnd-kit |

### 2.2 Estrutura de Diretórios
```
src/
├── assets/              # Imagens e logos
├── components/          # Componentes reutilizáveis
│   ├── ui/              # shadcn/ui (accordion, button, card, dialog, etc.)
│   ├── admin/           # Dialogs de admin (AdicionarUsuario, EditarUsuario)
│   ├── auth/            # AlterarSenhaObrigatoria
│   ├── configuracoes/   # ConfiguracaoJuros, ConfiguracaoTagsEncomendas
│   ├── financeiro/      # ContasReceberFormModal, DarBaixaDialog, DarBaixaPagarDialog
│   └── TiposInsumos/    # Embalagens, Ingredientes, Outros
├── contexts/            # AuthContext, GroupContext, GlobalLoadingContext
├── hooks/               # 24 hooks customizados
├── integrations/        # Supabase client e types (auto-gerados)
├── lib/                 # dateUtils, utils, validacaoSenha
├── pages/               # Todas as páginas organizadas por módulo
│   ├── admin/           # Governanca, Logs, Usuarios, UsuariosGrupo
│   ├── auth/            # Login, SignUp, ForgotPassword
│   ├── cadastros/       # Categorias, Clientes, Fornecedores, SeusDados, UnidadesMedida
│   ├── configuracoes/   # Bancos, CadastrosBase, PlanoContas, TiposDocumentos, etc.
│   ├── financeiro/      # ContasPagar/Receber, DRE, FluxoCaixa, Dashboard
│   └── precificacao/    # Ingredientes, Embalagens, PrePreparos
├── schemas/             # encomendaSchema, pagamentoSchema (Zod)
└── utils/               # gerarReciboPagamento, insightsGenerator

supabase/
├── config.toml          # Configuração (auto-gerado)
├── migrations/          # Migrações SQL
└── functions/
    ├── _shared/cors.ts
    ├── criar-usuario/
    └── migrate-logos-to-storage/
```

### 2.3 Design System
- **Paleta:** Rosa (#D15D66), Preto (#0F0F0F), Branco (#FFFFFF)
- **Auxiliares:** Info (#3533CD), Warning (#F4C542), Success (#3BA55D), Error (#B0353D)
- **Tokens semânticos:** `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- **Tema dark:** Suportado com variáveis CSS em `.dark`

---

## 3. MAPA DE ROTAS

### 3.1 Autenticação (público)
| Rota | Página |
|------|--------|
| `/auth/login` | Login com email/senha |
| `/auth/signup` | Cadastro de nova conta |
| `/auth/forgot-password` | Recuperação de senha |

### 3.2 Módulos Principais (protegidos)
| Rota | Página |
|------|--------|
| `/dashboard` | Painel com calendário, gráficos, top produtos |
| `/encomendas` | CRUD de encomendas com status/tags/itens |
| `/clientes` | Cadastro PF/PJ com familiares e aniversários |
| `/fornecedores` | Cadastro com contatos e aniversários |

### 3.3 Financeiro
| Rota | Página |
|------|--------|
| `/financeiro` | Hub do financeiro |
| `/financeiro/dashboard` | Dashboard financeiro |
| `/financeiro/contas-receber` | Listagem |
| `/financeiro/contas-receber/nova` | Criar |
| `/financeiro/contas-receber/editar/:id` | Editar |
| `/financeiro/contas-receber/detalhes/:id` | Detalhes |
| `/financeiro/contas-pagar` | Listagem |
| `/financeiro/contas-pagar/nova` | Criar |
| `/financeiro/contas-pagar/editar/:id` | Editar |
| `/financeiro/contas-pagar/detalhes/:id` | Detalhes |
| `/financeiro/fluxo-caixa` | Hub fluxo de caixa |
| `/financeiro/fluxo-caixa/diario` | Diário |
| `/financeiro/fluxo-caixa/mensal` | Mensal |
| `/financeiro/dre` | DRE |

### 3.4 Precificação
| Rota | Página |
|------|--------|
| `/precificacao` | Hub |
| `/precificacao/ficha-tecnica` | Fichas técnicas |
| `/precificacao/ficha-tecnica/nova` | Criar |
| `/precificacao/ficha-tecnica/editar/:id` | Editar |
| `/precificacao/ingredientes` | Ingredientes |
| `/precificacao/embalagens` | Embalagens |
| `/precificacao/pre-preparos` | Pré-preparos |
| `/precificacao/pre-preparos/novo` | Criar |
| `/precificacao/pre-preparos/:id` | Editar |

### 3.5 Configurações
| Rota | Página |
|------|--------|
| `/configuracoes` | Hub |
| `/configuracoes/cadastros-base` | Hub cadastros base |
| `/configuracoes/precificacao` | Config. precificação |
| `/configuracoes/financeiro` | Config. financeiro |
| `/configuracoes/dados-confeitaria` | Perfil/dados |
| `/configuracoes/categorias-receitas` | Categorias |
| `/configuracoes/unidades-medida` | Unidades |
| `/configuracoes/tipos-insumos` | Tipos de insumos |
| `/configuracoes/categorias-plano-contas` | Categorias plano contas |
| `/configuracoes/plano-contas` | Plano de contas |
| `/configuracoes/bancos` | Bancos/formas pagamento |
| `/configuracoes/tipos-documentos` | Tipos de documentos |
| `/configuracoes/juros` | Juros e multas |
| `/configuracoes/tags-encomendas` | Tags |
| `/configuracoes/precificacao/mao-de-obra` | Mão de obra |

### 3.6 Administração
| Rota | Acesso |
|------|--------|
| `/admin/governanca` | MOTHER |
| `/admin/usuarios-grupo` | ADMIN do grupo |
| `/admin/usuarios` | Admin (legado) |
| `/admin/logs` | Admin (legado) |

---

## 4. MODELO DE DADOS

### 4.1 Tabelas de Governança

**`groups`** — Grupos/empresas do sistema
| Campo | Tipo | Obrig. | Default |
|-------|------|:------:|---------|
| id | uuid | ✅ | gen_random_uuid() |
| name | text | ✅ | |
| created_by_user_id | uuid | | |
| is_active | bool | | true |
| created_at, updated_at | timestamptz | | now() |

**`user_global_roles`** — Papel global (MOTHER)
| Campo | Tipo | Obrig. |
|-------|------|:------:|
| id | uuid | ✅ |
| user_id | uuid | ✅ |
| role_global | enum('MOTHER') | ✅ |
| is_active | bool | |

**`user_group_roles`** — Participação em grupos
| Campo | Tipo | Obrig. |
|-------|------|:------:|
| id | uuid | ✅ |
| user_id | uuid | ✅ |
| group_id | uuid | ✅ |
| role_group | enum('ADMIN','USER') | ✅ |
| permission_flags | jsonb | |
| is_active | bool | |

**`user_active_session`** — Sessão ativa
| Campo | Tipo | Obrig. |
|-------|------|:------:|
| user_id | uuid | ✅ (PK unique) |
| active_group_id | uuid | |
| mode | text | |

### 4.2 Tabelas Funcionais

> Todas possuem `owner_group_id (uuid, FK → groups)` para isolamento multi-tenant.

**`profiles`** — id, email, nome_completo, nome_confeitaria, telefone, cpf, avatar_url, logo_url, endereco, cidade, estado, cep, bairro, numero, instagram, whatsapp, razao_social, inscricao_estadual, dias_trabalho_mes, horas_diaria_trabalho, meta_faturamento_mensal/anual, alerta_cmv, custo_fixo_mensal, valor_hora, primeiro_acesso, ativo, last_login, owner_group_id

**`clientes`** — id, usuario_id, nome, tipo, cpf_cnpj, email, telefone, endereco, numero, cidade, estado, cep, data_aniversario, observacoes, total_compras, quantidade_pedidos, ultima_compra, owner_group_id

**`cliente_familiares`** — id, cliente_id, usuario_id, nome, parentesco, data_nascimento, observacoes, ativo

**`fornecedores`** — id, usuario_id, nome, tipo, cpf_cnpj, email, telefone, observacoes, owner_group_id

**`fornecedor_contatos`** — id, fornecedor_id, usuario_id, nome, cargo, email, telefone, data_aniversario, observacoes, ativo

**`encomendas`** — id, usuario_id, cliente, valor, data_pedido, data_entrega, hora_entrega, status, numero, telefone, endereco, cep, observacoes, observacoes_cliente, observacoes_internas, desconto_percentual, desconto_valor, taxa_entrega, outros, saldo_restante, pagamentos(jsonb), conta_receber_id, topo_*, owner_group_id

**`encomenda_itens`** — id, encomenda_id, usuario_id, produto, receita_id, quantidade, unidade_medida, valor_unitario, subtotal, owner_group_id

**`encomendas_tags`** — id, encomenda_id, tag_id

**`receitas`** — id, usuario_id, nome, categoria, tipo, tempo_preparo, unidade_tempo, rendimento, unidade_rendimento, custo_total, valor_venda, cardapio, modo_preparo, owner_group_id

**`receitas_imagens`** — id, receita_id, url, ordem

**`receitas_embalagens`** — id, receita_id, embalagem_id, embalagem, marca, unidade_medida, qtde_embalagem, preco_embalagem, quantidade_utilizada, custo_unitario, custo_receita

**`receitas_despesas_venda`** — id, receita_id, despesa_id, nome, percentual, valor

**`ingredientes`** — id, usuario_id, tipo_insumo_id, preco, marca, categoria, data_atualizacao, e_pre_preparo, owner_group_id

**`embalagens`** — id, usuario_id, tipo_insumo_id, preco, marca, data_atualizacao, owner_group_id

**`pre_preparos`** — id, usuario_id, nome, tempo_preparo, tempo_preparo_unidade, rendimento_quantidade, rendimento_unidade_id, custo_total, custo_por_unidade, categoria_id, modo_preparo, imagem_1_url, imagem_2_url, owner_group_id

**`pre_preparos_ingredientes`** — id, pre_preparo_id, ingrediente_id, quantidade_utilizada, custo_ingrediente, ordem

**`contas_receber`** — id, usuario_id, descricao, valor, data_vencimento, banco_id, tipo_lancamento, numero_parcelas, status, cliente_id, cliente_nome, cliente_documento, categoria_id, plano_conta_id, tipo_documento_id, data_emissao, data_recebimento, numero_documento, e_recorrente, dia_vencimento_recorrente, observacoes, owner_group_id

**`contas_receber_parcelas`** — id, conta_receber_id, numero_parcela, data_vencimento, valor_parcela, valor_total, data_emissao, status, valor_pago, valor_recebido, juros, desconto, data_pagamento, data_recebimento, observacao, observacao_interna, tags

**`contas_receber_pagamentos`** — id, parcela_id, data_pagamento, valor_pago, banco_id, tipo_documento_id, juros, desconto, estornado, data_estorno, motivo_estorno, observacao

**`contas_receber_comprovantes`** — id, pagamento_id, nome_arquivo, url_storage, tipo_arquivo, tamanho_bytes

**`contas_pagar`** — Mesma estrutura de contas_receber (com fornecedor_id em vez de cliente_id)

**`contas_pagar_parcelas`** — Mesma estrutura de contas_receber_parcelas

**`contas_pagar_pagamentos`** — Mesma estrutura de contas_receber_pagamentos

**`contas_pagar_comprovantes`** — Mesma estrutura de contas_receber_comprovantes

### 4.3 Tabelas de Configuração

**`categorias`** — id, usuario_id, nome, ativo, padrao_sistema, owner_group_id

**`tipos_insumos`** — Tipos de ingredientes/embalagens

**`unidades_medida`** — id, usuario_id, nome, sigla, codigo, ativo, e_padrao, owner_group_id

**`bancos`** — id, usuario_id, nome, tipo, codigo, saldo_inicial, e_banco_oficial, e_customizado, habilitado, owner_group_id

**`tipos_documento`** — id, usuario_id, descricao, codigo, ativo, habilitado, e_padrao, contador_uso, owner_group_id

**`categorias_plano_contas`** — id, user_id, codigo, descricao, indicador, faixa_dre, ordem, ativo, e_padrao, padrao_sistema, owner_group_id

**`plano_contas`** — id, user_id, categoria_id, codigo, codigo_estruturado, descricao, ativo, e_padrao, padrao_sistema, owner_group_id

**`custos_fixos`** — id, usuario_id, nome, valor, tipo, owner_group_id

**`configuracoes_juros`** — id, usuario_id, cobrar_juros, percentual_juros, tipo_juros, multa_atraso, percentual_multa, observacao, owner_group_id

**`tags_encomendas`** — id, user_id, nome, cor, descricao, ativo, padrao_sistema, owner_group_id

**`mao_obra_perfis`** — id, user_id, nome, valor_hora, padrao, ativo, owner_group_id

**`mao_obra_perfis_historico`** — id, perfil_id, acao, user_id, valor_antigo, valor_novo

**`admin_logs`** — id, admin_id, admin_email, acao, usuario_afetado_id, usuario_afetado_email, detalhes

### 4.4 Views
| View | Descrição |
|------|-----------|
| `vw_contas_receber_parcelas` | Parcelas com dados do título, cliente, banco |
| `vw_contas_receber_dashboard` | Resumo financeiro de contas a receber |
| `vw_resumo_financeiro` | Resumo de saldos bancários |

---

## 5. GOVERNANÇA E PERMISSÕES

### 5.1 Papéis
| Papel | Escopo | Descrição |
|-------|--------|-----------|
| MOTHER | Global | Administrador único — governança de grupos |
| ADMIN | Grupo | Administrador de um grupo específico |
| USER | Grupo | Usuário com permissões granulares |

### 5.2 Regras de Isolamento
- Todas as queries filtram por `owner_group_id = active_group_id`
- MOTHER NÃO tem acesso automático a dados de grupos
- MOTHER deve ser adicionada como membro para operar num grupo
- ADMIN vê 100% dos dados do seu grupo
- USER vê/edita conforme `permission_flags`

### 5.3 Permission Flags
```json
{
  "financeiro_view": true, "financeiro_edit": false,
  "metas_view": true, "metas_edit": false,
  "tarefas_view": true, "tarefas_edit": false,
  "cadastros_view": true, "cadastros_edit": false,
  "receitas_view": true, "receitas_edit": false,
  "encomendas_view": true, "encomendas_edit": false,
  "precificacao_view": true, "precificacao_edit": false,
  "admin_users_manage": false
}
```

### 5.4 Funções SQL
| Função | Retorno |
|--------|---------|
| `is_mother(user_id)` | boolean |
| `is_group_admin(user_id, group_id)` | boolean |
| `user_belongs_to_group(user_id, group_id)` | boolean |
| `get_active_group_id(user_id)` | uuid |
| `has_permission(user_id, group_id, permission)` | boolean |
| `get_user_group_role(user_id, group_id)` | role_group |

### 5.5 Componentes de Segurança
```tsx
<PermissionGuard permission="financeiro_edit">...</PermissionGuard>
<PermissionGuard requireAdmin>...</PermissionGuard>
<PermissionGuard requireMother>...</PermissionGuard>
```

Hook: `useGroupFilter()` — `addGroupFilter(query)`, `getGroupInsertData()`, `canAccessData()`

---

## 6. RLS (Row Level Security)

### Tabelas funcionais
- `SELECT/INSERT/UPDATE/DELETE`: `auth.uid() = usuario_id`

### Tabelas de governança
- `groups`: MOTHER vê todos; usuários veem seus grupos
- `user_group_roles`: MOTHER vê todos; ADMIN vê papéis do grupo; USER vê seus
- `user_active_session`: cada usuário gerencia sua sessão

### Tabelas filhas
- Verificação via `EXISTS (SELECT 1 FROM tabela_pai ...)` encadeada

### Com padrão do sistema
- `plano_contas`, `tags_encomendas`: `padrao_sistema = true` visível para todos

---

## 7. FLUXOS PRINCIPAIS

### 7.1 Cadastro e Login
1. Signup → profile criado → grupo criado automaticamente
2. Login → verificação de conta ativa → primeiro acesso redireciona para SeusDados

### 7.2 Encomenda
1. Nova encomenda → cliente, datas, itens (produto+receita+qtde+valor)
2. Descontos, taxa entrega, tags → salvar (status: pendente)
3. Opcional: gerar conta a receber vinculada

### 7.3 Precificação
1. Cadastrar ingredientes/embalagens com preços
2. Opcionalmente criar pré-preparos
3. Criar receita → ingredientes + embalagens + mão de obra
4. Sistema calcula custo total/unitário → definir valor de venda

### 7.4 Contas a Receber/Pagar
1. Criar título → parcelas automáticas
2. Dar baixa → banco, tipo doc, juros, desconto, comprovante
3. Estorno com motivo

### 7.5 DRE
Selecionar período → agrupamento por plano de contas → receitas - deduções - custos - despesas = resultado

### 7.6 Fluxo de Caixa
Diário (por dia) ou Mensal (consolidado com saldo acumulado)

---

## 8. CONTEXTS E HOOKS

### Contexts
| Context | Responsabilidade |
|---------|-----------------|
| `AuthContext` | Login, signup, logout, reset |
| `GroupContext` | Grupos, papéis, permissões, sessão ativa |
| `GlobalLoadingContext` | Loading global com mascote |

### Hooks (24)
| Hook | Descrição |
|------|-----------|
| `useGroupFilter` | Filtro por grupo ativo |
| `useClientes` | CRUD clientes |
| `useFornecedores` | CRUD fornecedores |
| `useFornecedorContatos` | Contatos de fornecedores |
| `useFamiliares` | Familiares de clientes |
| `useReceitas` | Fichas técnicas |
| `useReceitasMaoObra` | Mão de obra em receitas |
| `useEncomendas` | CRUD encomendas |
| `useEncomendaItens` | Itens de encomendas |
| `useCategorias` | Categorias |
| `useCustosFixos` | Custos fixos |
| `useCalculosReceita` | Cálculos de precificação |
| `useMaoObraPerfis` | Perfis de mão de obra |
| `useMaoObraHistorico` | Histórico mão de obra |
| `usePrePreparosMaoObra` | Mão de obra pré-preparos |
| `usePlanejamento` | Planejamento |
| `useTiposDocumento` | Tipos de documento |
| `useUnidadesMedida` | Unidades de medida |
| `useIsAdmin` | Admin (legado) |
| `useUserId` | ID do usuário |
| `useUserProfile` | Perfil do usuário |
| `useViaCEP` | Consulta CEP |
| `use-mobile` | Detecção mobile |
| `use-toast` | Notificações |

---

## 9. EDGE FUNCTIONS

| Função | Descrição |
|--------|-----------|
| `criar-usuario` | Criação de usuários pelo admin |
| `migrate-logos-to-storage` | Migração de logos para Storage |

---

## 10. UTILITÁRIOS

### dateUtils (`src/lib/dateUtils.ts`)
Resolve problema de timezone (-1 dia):
| Função | Descrição |
|--------|-----------|
| `formatDateToISO(date)` | Date → 'YYYY-MM-DD' local |
| `parseISOToDate(str)` | 'YYYY-MM-DD' → Date local |
| `formatDateBR(str)` | → 'DD/MM/YYYY' |
| `getTodayISO()` | Hoje local |
| `addMonthsToDate/addDaysToDate` | Aritmética |
| `diffInDays` | Diferença |
| `getFirstDayOfMonth/getLastDayOfMonth` | Limites do mês |
| `isOverdue/isToday` | Verificações |

### Outros
| Arquivo | Descrição |
|---------|-----------|
| `src/lib/utils.ts` | `cn()` para Tailwind |
| `src/lib/validacaoSenha.ts` | Validação de senha |
| `src/utils/gerarReciboPagamento.ts` | PDF de recibo |
| `src/utils/insightsGenerator.ts` | Insights dashboard |

---

## 11. INTEGRAÇÕES

### Ativas
| Integração | Descrição |
|------------|-----------|
| Supabase Auth | Login, cadastro, recuperação |
| Supabase Storage | Logos, comprovantes, imagens |
| ViaCEP | Consulta de endereço |
| jsPDF | Recibos em PDF |
| xlsx | Export/import planilhas |

### Não Implementadas
| Integração | Prioridade |
|------------|-----------|
| WhatsApp | Alta |
| Email transacional | Alta |
| Gateway de pagamento | Média |
| Google Drive | Baixa |

---

## 12. PENDÊNCIAS E RISCOS

### Pendências Críticas
1. **Filtro por `owner_group_id`:** A maioria dos hooks filtra por `usuario_id` — precisa migrar para `owner_group_id` via `useGroupFilter`
2. **RLS por grupo:** Políticas atuais usam `usuario_id` — atualizar para `owner_group_id`
3. **Tags encomendas:** Faltam políticas INSERT/UPDATE/DELETE
4. **Views sem RLS:** `vw_contas_receber_dashboard`, `vw_contas_receber_parcelas`, `vw_resumo_financeiro`

### Riscos
1. Migração `usuario_id → owner_group_id` — transição gradual necessária
2. Performance — faltam índices em `owner_group_id`
3. Concorrência de sessão — múltiplas abas
4. Duplicação admin legado (`useIsAdmin`) vs `GroupContext`
5. Datas — correção de timezone pode ter pontos faltantes

---

## 13. BACKLOG

### MVP ✅
- Autenticação, clientes, fornecedores, encomendas, fichas técnicas
- Contas a receber/pagar, dashboard, governança multi-tenant

### V1 (Próximo)
- Integrar `useGroupFilter` em todos os hooks
- Atualizar RLS para `owner_group_id`
- `PermissionGuard` em todos os componentes sensíveis
- Índices em `owner_group_id`
- Relatórios PDF financeiro
- Módulo de estoque

### V2 (Futuro)
- WhatsApp, email transacional
- Gateway de pagamento (PIX)
- PWA mobile
- IA (insights automáticos)
- Catálogo público
- Integração delivery

---

## 14. DEFINIR PRIMEIRO MOTHER

```sql
INSERT INTO user_global_roles (user_id, role_global, is_active)
VALUES ('SEU_USER_ID_AQUI', 'MOTHER', true);
```

---

*Documentação atualizada em Fevereiro 2026 — Projeto Caixa de Açúcar*
