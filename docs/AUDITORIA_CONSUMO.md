# Auditoria de Consumo e Arquitetura — Spa Flor de Baunilha

**Data:** 2026-05-29 UTC
**Escopo:** Diagnóstico real baseado no estado atual do projeto (banco, storage, edge functions, realtime, IA, cron e frontend).

---

## 1. Consumo de Nuvem e IA — estado real medido

| Recurso | Medição | Observação |
|---|---|---|
| **Banco de dados (tamanho)** | **28 MB** | Praticamente vazio. Maior tabela: `plano_contas` com 66 linhas. Tabelas de negócio (`encomendas`, `receitas`, `ingredientes`, `contas_*`) estão **zeradas** — projeto pré-produção. |
| **Armazenamento (Storage)** | **86 kB** total, **7 objetos**, apenas no bucket `backups` | Buckets `assinaturas` e `topo-bolo` existem mas estão vazios. Consumo desprezível. |
| **Edge Functions** | 11 funções deployadas | `ai-proxy`, `aplicar-planos-pendentes`, `criar-usuario`, `enviar-recuperacao-senha`, `executar-backups-agendados`, `gerar-token-sso-doce`, `hotmart-webhook`, `notificar-expiracao-imersao`, `restaurar-backup`, `validar-token-retorno-doce` + `_shared`. Sem indícios de invocação descontrolada. |
| **Rede / egress** | Desprezível | Banco e Storage minúsculos; sem CDN externo. |
| **Realtime** | **1 tabela** na publicação `supabase_realtime`: `public.encomendas` | 5 arquivos no frontend abrem `supabase.channel(...)` sobre essa tabela. Volume zero hoje. |
| **IA / tokens** | Modelos liberados em `ai-proxy`: `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro`. Default = `gemini-2.5-flash` | Único consumidor é a feature **Conversa Doce** (`ConversaDoceRespostas.tsx`). Sem chamadas em loop, sem streaming agressivo. Há rate limit + quota por plano no `ai-proxy`. |
| **Jobs em background (pg_cron)** | 1 job ativo: `executar-backups-agendados` (invoca edge function via anon key armazenada no Vault) | Configuração saudável. |

**Migrations:** 235 arquivos — alto, mas reflete o histórico de iteração; não impacta custo de runtime.

---

## 2. Detecção de desperdícios

✅ **Nada crítico detectado.** Itens dignos de nota:

- **Realtime em `encomendas`** — está habilitado globalmente, mas as 5 subscriptions no front (Dashboard, EncomendasDoDia, CalendariosEncomendas, hook `useEncomendasHoje`, ConfiguracaoTagsEncomendas) **não filtram por `owner_group_id`**. Hoje sem volume não dói; com 100+ tenants vira *fan-out* de payloads que o cliente descarta no JS. **Ponto de atenção.**
- **`refetchInterval` de 1h** em `AlertaExpiracaoPlano.tsx` (`1000*60*60`) — totalmente aceitável. Único polling do app.
- **`setInterval` no `ReceitaForm.tsx` (linha 612)** — confirmar se é limpo no `unmount` (geralmente é um cronômetro de UI). Verificar `clearInterval` no cleanup do `useEffect` para não vazar.
- **Modelos de IA** — só `gemini-2.5-flash` em uso real. `gemini-2.5-pro` está só na allowlist; não está sendo chamado. **Sem desperdício de tokens caros.**
- **Edge Functions** — todas sob demanda (webhooks Hotmart, criação de usuário, recuperação de senha, SSO Doce, backup). Nenhuma roda em loop.
- **Consultas repetidas ao banco** — não há padrão de N+1 evidente no scan; React Query está em uso (`useQuery` espalhado em hooks). Sem `refetchOnWindowFocus` problemático configurado globalmente.
- **Backups** — bucket com 7 arquivos = ~12 dias acumulados. Política de retenção precisa ser confirmada para não crescer linearmente.

❌ **Não há:** loops infinitos, jobs duplicados, realtime espalhado em tabelas erradas, modelos LLM premium em background.

---

## 3. Dimensionamento da infraestrutura

**Veredito: superdimensionado em relação ao uso real, mas dimensionado corretamente para a fase pré-lançamento.**

- Banco de 28 MB em uma instância Supabase managed → **uso < 0.1%** da capacidade típica.
- Storage 86 kB → idem.
- Edge Functions sem invocações relevantes hoje.

O projeto **não precisa de upgrade de tier**. Pode operar tranquilo no plano free/inicial até centenas de tenants ativos, desde que se corrijam os pontos da seção 4.

---

## 4. Otimizações recomendadas

### Quick wins (1–2h cada)

1. **Filtrar Realtime de `encomendas` por `owner_group_id`** nas 5 subscriptions — adicionar `filter: 'owner_group_id=eq.${groupId}'` no `.on('postgres_changes', ...)`. **Impacto:** reduz tráfego realtime em ~N (nº de tenants) e CPU no cliente.
2. **Retenção de backups** — adicionar limpeza no `executar-backups-agendados` mantendo só os últimos 7/14. **Impacto:** evita crescimento linear do bucket.
3. **Auditar `setInterval` em `ReceitaForm.tsx:612`** — garantir `clearInterval` no cleanup. **Impacto:** elimina vazamento de timer se houver.
4. **Confirmar `staleTime` global no React Query** (`src/main.tsx` / QueryClient) — definir `staleTime: 60_000` evita refetches automáticos ao trocar de aba. **Impacto:** -20% a -40% de chamadas ao PostgREST.

### Estruturais (médio prazo)

5. **Índices em colunas multi-tenant** — verificar índice em `owner_group_id` nas tabelas grandes (`encomendas`, `contas_pagar_parcelas`, `contas_receber_*`, `receitas`, `ingredientes`). Sem isso, RLS faz seq-scan quando a base crescer.
6. **Centralizar invalidations** — algumas mutations podem estar invalidando queries amplas. Vale revisar `queryClient.invalidateQueries({ queryKey: [...] })` para chaves específicas.
7. **Edge Function `ai-proxy`** — já tem quota por plano. Adicionar **cache de respostas idênticas por hash** (Deno KV ou tabela) para perguntas repetidas no Conversa Doce. **Impacto:** -30% tokens em uso intenso.

### Críticos

Nenhum item crítico hoje. O sistema está pré-produção e os controles certos estão presentes (RLS, ai-proxy com quota, single cron job).

---

## 5. Risco futuro de escalabilidade

| Risco | Quando dói | Mitigação |
|---|---|---|
| Realtime `encomendas` sem filtro por tenant | A partir de ~50 grupos ativos | Quick win #1 |
| Falta de índice em `owner_group_id` | A partir de ~10k linhas/tabela | Item estrutural #5 |
| Bucket `backups` crescendo sem TTL | A partir de 3–6 meses em produção | Quick win #2 |
| `ai-proxy` sem cache | Quando Conversa Doce ficar popular | Item estrutural #7 |
| Hotmart webhook + `aplicar-planos-pendentes` | Picos de venda → race conditions | Já existe retry; monitorar logs |
| 235 migrations | Restore de banco fica lento | Apenas operacional; não afeta runtime |

---

## 6. Duplicidade de cobrança Lovable × externos

✅ **Não há duplicidade detectada.**

- **Backend** = Lovable Cloud (Supabase gerenciado pelo Lovable). Não existe Supabase externo conectado em paralelo.
- **IA** = exclusivamente Lovable AI Gateway via `ai-proxy`. Sem chave OpenAI/Anthropic/Google própria configurada nos secrets para esse fim.
- **E-mail** = Resend via Edge Function (substitui o e-mail nativo do Supabase, que foi suprimido). Não há sobreposição — você paga só o Resend.
- **Hotmart** = webhook recebido, sem polling reverso. Sem custo duplicado.
- **Conversa Doce SSO (gerar-token / validar-token)** = lógica interna; nenhum SaaS pago em paralelo.

Único custo externo legítimo e isolado: **Resend** (e-mails transacionais). Sem sobreposição com Lovable.

---

## 7. Score final

| Dimensão | Avaliação |
|---|---|
| Consumo atual | **Mínimo** (28 MB DB, 86 kB Storage) |
| Arquitetura | **Sólida** (RLS, ai-proxy centralizado, cron único, sem realtime indevido) |
| Eficiência de código | **Boa**, com 2–3 ajustes finos pendentes |
| Risco de explosão de custo a curto prazo | **Baixíssimo** |
| Risco a médio prazo (1k+ usuários) | **Médio** sem os quick wins #1 e #5 |

### Classificação: 🟢 **EFICIENTE**
### Nota: **8.5 / 10**

Os 1.5 pontos descontados são: filtro de realtime por tenant ausente, ausência confirmada de índices em `owner_group_id` nas tabelas de negócio e falta de TTL nos backups. Nenhum deles é urgente hoje, mas todos viram dor a partir do primeiro lote real de usuários.

---

**Próxima ação sugerida:** se quiser, eu aplico os 4 quick wins agora em uma única migration + ajustes no frontend. Tempo estimado: 30–45 min.

---

## ✅ 2026-05-29 — Índices em `owner_group_id` aplicados

Migration criou `idx_<tabela>_owner_group` (com `IF NOT EXISTS`) nas seguintes tabelas de negócio:

- `encomendas`, `encomenda_itens`
- `estoque`, `estoque_movimentacoes`
- `custos_fixos`, `mao_obra_perfis`, `meu_salario_retiradas`, `pre_preparos`
- `fechamentos_mensais`
- `transferencias_bancos`

- `backups`, `backups_cofre`
- `profiles`

Tabelas já indexadas previamente (ignoradas pelo `IF NOT EXISTS`): `clientes`, `fornecedores`, `fornecedor_contatos`, `ingredientes`, `embalagens`, `receitas`, `contas_pagar`, `contas_receber`, `contratos`, `propostas`, `fechamento_logs`.

Tabelas de configuração com baixa cardinalidade (categorias, bancos, plano_contas, tipos_*, unidades_medida, tags_encomendas, configuracoes_juros) foram deliberadamente deixadas sem índice — overhead não compensa o ganho.

---

## ✅ 2026-05-29 — Validação de uso dos índices `owner_group_id`

Consulta em `pg_stat_user_indexes` retornou **27 índices com `idx_scan = 0`** — todos os criados nesta rodada + os pré-existentes. Resultado esperado: base praticamente vazia e índices recém-criados/sem tráfego de produção. Nenhum índice será removido agora; reavaliar após 30 dias de uso real.

Lista (zero scans):
backups, backups_cofre, clientes, contas_receber, contratos (unique key), custos_fixos, embalagens, encomenda_itens, encomendas, estoque, estoque_movimentacoes, fechamentos_mensais, fornecedores, ingredientes, mao_obra_perfis, meu_salario_retiradas, pre_preparos, profiles, propostas (unique key), receitas, transferencias_bancos.

---

## ✅ 2026-05-29 — Retenção de backups (30 dias) aplicada

`supabase/functions/executar-backups-agendados/index.ts`: a limpeza de backups antigos agora roda **sempre após o novo backup ser salvo com sucesso**, com default de **30 dias** quando o agendamento não definir `retencao_dias` próprio. Remove tanto a linha em `public.backups` quanto o arquivo em `storage.backups`.

Cofre (`backups_cofre`) mantém sua política própria: mensais (`eh_mensal=true`) + 5 mais recentes do grupo.
