# Portar Propostas e Contratos para o Caixa de Açúcar

Vou portar do projeto **Planejamento D.O.C.E.** os módulos completos de Propostas e Contratos, adaptados ao padrão multi-tenant, à identidade visual e ao controle de plano do Caixa de Açúcar.

## 1. Banco de dados (1 migração)

Criar 3 novas tabelas + 2 buckets de storage, todas com `owner_group_id` e RLS multi-tenant:

- **`propostas`** — propostas/orçamentos por grupo. Campos principais: dados do cliente (nome, telefone, email, endereço completo), `produtos` (JSONB), valor total, desconto, frete, data de emissão, data de validade, data de retirada/entrega, forma de pagamento, observações, número sequencial por grupo, status (rascunho/enviada/aceita/rejeitada/expirada).
- **`contratos_templates`** — templates de contrato gerenciados pelo admin (MOTHER). Campos: nome, tipo, descrição, ícone, lista de campos dinâmicos (JSONB), corpo do template, ativo. Leitura aberta a todo authenticated, escrita só para MOTHER.
- **`contratos`** — contratos gerados por grupo. Campos: template usado, número sequencial por grupo, dados do cliente, valor total, data do evento, `form_data` (JSONB com respostas), URL do PDF, status (rascunho/enviado/assinado/cancelado), datas de envio/assinatura, observações.
- **Buckets storage**: `assinaturas` (público, para logo da assinatura do responsável) e `contratos-pdf` (privado, para PDFs gerados). RLS por `owner_group_id` na pasta raiz.

`GRANT`s explícitos para `authenticated` e `service_role` em todas as tabelas, RLS escopada por `current_user_group()` (função já existente).

Reaproveito a tabela `profiles` (que já tem nome_confeitaria, CNPJ, endereço, logomarca etc) como `business_profile` — não preciso de tabela nova nem colunas extras significativas. Adiciono só os campos faltantes:
- `assinatura_url` (URL da imagem da assinatura digital)
- `dados_bancarios` (JSONB com banco/agência/conta/PIX)

## 2. Dependências

- Instalar `jspdf` (geração de PDF client-side, já usado no projeto original).

## 3. Estrutura de código

```text
src/
├── pages/
│   ├── comercial/
│   │   ├── Propostas.tsx              (listagem + dashboard)
│   │   ├── NovaProposta.tsx           (form de criar/editar)
│   │   ├── RelatorioPropostas.tsx     (relatório anual)
│   │   └── Contratos.tsx              (template selector + form + lista)
├── components/
│   ├── propostas/
│   │   ├── ProposalStatsDashboard.tsx
│   │   ├── ProposalListTable.tsx
│   │   ├── ProposalTemplatesSelector.tsx
│   │   ├── ProductTemplates.tsx
│   │   ├── PDFPreview.tsx
│   │   ├── AnnualProposalReport.tsx
│   │   ├── GenerateProposalCard.tsx
│   │   └── WhatsAppConfirmDialog.tsx
│   └── contratos/
│       ├── TemplateSelector.tsx
│       ├── DynamicContractForm.tsx
│       ├── ContractFormField.tsx
│       ├── ContractFormSection.tsx
│       ├── ContractPreview.tsx
│       ├── ContractsList.tsx
│       └── ContractStats.tsx
├── hooks/
│   ├── usePropostas.ts                (adaptado de useProposals)
│   ├── useContratos.ts                (adaptado de useContracts)
│   ├── useContratoPdf.ts              (adaptado de useContractPdf)
│   └── useBusinessProfile.ts          (lê de profiles, não de tabela nova)
├── services/
│   ├── propostaService.ts
│   └── contratoService.ts
├── lib/
│   └── contractTemplates.ts           (definições dos templates fixos)
└── types/
    ├── proposta.ts
    └── contrato.ts
```

Todo o código é reescrito usando:
- Tokens `cda-*` do design system (vinho/dourado/creme), sem `bg-primary` genérico ou estilos do app antigo.
- `PageHeader` + `BackButton` padrão do Caixa de Açúcar.
- `useGroup()` para `activeGroup.id` (no lugar de `user_id`).
- `useQuery`/`useMutation` do TanStack Query (já é padrão aqui).
- `dateUtils` para datas, evitando bugs de timezone.

## 4. Sidebar e rotas

- Em `AppSidebar.tsx`, seção **MEU COMERCIAL**, adicionar 2 itens entre os existentes:
  - `Propostas` (ícone `FileText`) → `/comercial/propostas`
  - `Contratos` (ícone `ScrollText`) → `/comercial/contratos`
- Restrição de plano: aplicar guarda para liberar apenas para `negocio`, `aluna_imersao` e MOTHER. Lite não vê os itens (igual ao padrão atual de SSO Doce). Atualizo `mem://architecture/plan-access-control`.
- Em `App.tsx`, adicionar 4 rotas (`/comercial/propostas`, `/comercial/propostas/nova`, `/comercial/propostas/relatorio`, `/comercial/contratos`) dentro de `ProtectedRoute > Layout > PlanoGuard`.

## 5. Seed inicial de templates de contrato

Inserir 2–3 templates padrão na `contratos_templates` (Bolo de festa, Encomenda Geral, Evento) — copiados do projeto original via `supabase--insert`.

## 6. Documentação

Atualizar:
- `docs/AUDITORIA.md` — registrar criação das tabelas, RLS, buckets.
- `mem://features/propostas` e `mem://features/contratos` — novas memórias com decisões de arquitetura.
- `mem://index.md` — incluir referências.

## Fluxo de aprovação

Este é um trabalho grande (≈ 25 arquivos novos, 1 migração com 3 tabelas + 2 buckets, 1 dependência nova). Vou executar em 4 etapas, esperando sua aprovação na primeira (migração) antes de prosseguir:

1. **Migração SQL** — criar tabelas, buckets, RLS, GRANTs. Aguardo seu OK.
2. **Backend portado** — services, hooks, types, lib de templates + seed de templates.
3. **UI Propostas** — páginas e componentes do módulo Propostas.
4. **UI Contratos + sidebar + plano guard + docs** — fechar o fluxo end-to-end.

Quer que eu siga por esse plano?