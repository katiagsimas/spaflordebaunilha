## Módulo "Meu Salário" • Método Renda Doce

Experiência de consciência financeira para confeiteiras, baseada no mês anterior fechado, com tom acolhedor e identidade visual própria (vinho, rosé queimado, dourado suave, creme).

### 1. Navegação e acesso

- Novo item no `mainMenuItems` do `AppSidebar.tsx`, logo abaixo de "Meu Dinheiro":
  - Título: `Meu Salário`
  - Ícone: `Sparkles` (lucide)
  - Rota: `/meu-salario`
- Rota registrada em `src/App.tsx` dentro do layout autenticado, protegida por `PlanoGuard`.
- Durante validação: liberar apenas para admin (mesmo padrão de "Meus Insumos" / "Meu Planejamento"), via flag em `PlanoGuard.tsx`. Decisão final de plano fica para depois.

### 2. Estrutura de páginas

Pasta `src/pages/meu-salario/` com:

- `MeuSalario.tsx` (container com header "Meu Salário • Método Renda Doce" + tabs)
- `VisaoGeral.tsx` — painel principal
- `Retiradas.tsx` — histórico + comparação com pró-labore saudável
- `Educativo.tsx` — mini-conteúdos humanizados
- Componentes auxiliares em `src/components/meu-salario/`:
  - `CardResumoMes.tsx` (faturamento, custos, margem, pró-labore sugerido)
  - `CenarioResultado.tsx` (3 cenários com microcopy acolhedor)
  - `RetiradaForm.tsx` (registrar retirada)
  - `HistoricoMensal.tsx` (lista + gráfico leve com Recharts)
  - `FraseRendaDoce.tsx` (frases rotativas)

### 3. Lógica financeira (Renda Doce)

Sempre usar o **mês anterior fechado** (ex.: em maio analisa abril).

```
faturamento_mes_anterior  = soma de contas a receber RECEBIDAS no mês anterior
custos_mes_anterior       = soma de contas a pagar PAGAS no mês anterior
margem_seguranca          = faturamento * 0.20   (fixa)
pro_labore_saudavel       = faturamento - custos - margem_seguranca
retiradas_realizadas      = soma de retiradas registradas no mês anterior
saldo_restante            = pro_labore_saudavel - retiradas_realizadas
```

Cenários:
- `saldo_restante > 0` → Cenário 1 (margem disponível)
- `|saldo_restante| <= 5%` → Cenário 2 (equilíbrio)
- `saldo_restante < 0` → Cenário 3 (acima do saudável, tom acolhedor)

Faturamento e custos serão lidos de tabelas existentes (`contas_receber`, `contas_pagar`) filtrados por `owner_group_id` e data de baixa no intervalo do mês anterior.

### 4. Banco de dados

Migração nova: `meu_salario_retiradas`

| coluna | tipo |
|---|---|
| id | uuid PK |
| owner_group_id | uuid not null |
| user_id | uuid not null |
| data_retirada | date not null |
| valor | numeric(12,2) not null |
| descricao | text |
| created_at / updated_at | timestamptz |

- RLS por `owner_group_id` (mesmo padrão de `planejamento_*`).
- Índice em `(owner_group_id, data_retirada)`.

### 5. Hook de dados

`src/hooks/useMeuSalario.ts`:
- `useResumoMesAnterior()` — calcula faturamento, custos, margem, pró-labore sugerido, retiradas, saldo, cenário.
- `useRetiradas(mes)` — lista, criar, editar, excluir.
- `useHistoricoMeuSalario(meses=6)` — agregado mês a mês para gráfico.

### 6. Identidade visual própria

Tokens locais no escopo do módulo (sem alterar tema global), via classes utilitárias e variáveis CSS adicionadas em `src/index.css`:

```
--rd-vinho:        345 55% 25%
--rd-rose-queimado:12 45% 55%
--rd-dourado:      40 55% 60%
--rd-creme:        38 50% 96%
```

Wrapper `.renda-doce-scope` aplicado em `MeuSalario.tsx` define background creme, cards com borda dourada suave, tipografia mais editorial. Mantém shadcn components para consistência estrutural.

### 7. Microcopy e área educativa

Strings centralizadas em `src/pages/meu-salario/copy.ts`:
- frases rotativas ("Lucro não é o que entra. É o que sobra.", etc.)
- mensagens dos 3 cenários
- mini-textos educativos (faturamento vs lucro, pró-labore, reserva, retirada saudável, organização)

### 8. Exportação PDF "Salvar meu resumo"

Botão no header de `VisaoGeral`. Usa `jspdf` (já presente em outros utils) para gerar PDF elegante:
- capa com "Meu Salário • Método Renda Doce" + mês de referência
- bloco de números (faturamento, custos, margem, pró-labore saudável, retiradas, saldo)
- cenário do mês com mensagem
- rodapé com frase Renda Doce

Arquivo: `src/utils/exportarMeuSalarioPDF.ts`.

### 9. Documentação

- Criar `DOCS_MEU_SALARIO.md` (estrutura, lógica Renda Doce, cenários, RLS, integrações).
- Atualizar `docs/AUDITORIA.md` com a nova migração + RLS.

### Detalhes técnicos

- Datas via `src/lib/dateUtils.ts` (sem timezone shift).
- Acesso obedece `PlanoGuard` (admin-only por enquanto).
- Sem alterações no `useEncomendas`, `useFinanceiro` etc. — apenas leituras agregadas via Supabase.
- Tipos de Supabase atualizados após a migração (auto).

### Fora de escopo (para fases futuras)

- Integração automática de retiradas com lançamentos do "Meu Dinheiro" (apenas leitura agregada por enquanto).
- Notificações/alertas push.
- Liberação por plano comercial (decidida depois).
