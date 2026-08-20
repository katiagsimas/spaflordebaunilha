# Backup & Restauração — Spa Flor de Baunilha

Última atualização: 2026-05-26

Este documento descreve o fluxo end-to-end de **backup** e **restauração** no sistema, incluindo o **Cofre de Backups** (MOTHER-only) usado para suporte.

---

## 1. Visão geral

Existem três superfícies de backup:

| Superfície | Quem usa | Local | Retenção |
|---|---|---|---|
| **Backups do usuário** | Qualquer usuário autenticado | Tabela `backups` + bucket `backups` | Configurável por agendamento (7d a 1 ano) |
| **Cofre de Backups** | Apenas MOTHER (suporte) | Tabela `backups_cofre` + bucket `backups-cofre` | Backup do **dia 1 de cada mês** + **5 backups mais recentes** (rolling) |
| **Restauração via arquivo** | Qualquer usuário | Upload `.json` local | N/A |

Todo backup bem-sucedido (manual ou agendado) é **espelhado automaticamente** para o Cofre.

---

## 2. Estrutura técnica

### Tabelas
- `public.backups` — metadados do backup do usuário (`id`, `nome`, `caminho_storage`, `tamanho_bytes`, `modulos`, `origem`, `usuario_id`, `owner_group_id`, `criado_em`).
- `public.backups_cofre` — espelho administrativo (`id`, `backup_id` referência, `caminho_storage`, `owner_group_id`, `eh_mensal`, `criado_em`).
- `public.backup_agendamentos` — agenda + `retencao_dias` + `modulos[]`.

### Buckets de Storage
- `backups` (privado) — RLS: dono lê/escreve, MOTHER lê.
- `backups-cofre` (privado) — RLS: apenas `service_role` escreve; MOTHER lê via Edge Function.

### Edge Functions
- `executar-backups-agendados` — roda agendamentos, gera JSON, salva em `backups`, espelha no Cofre e aplica retenção dos dois lados.
- `restaurar-backup` — executa restauração real (DELETE + INSERT batch) com validação server-side da palavra-chave.

---

## 3. Fluxo de Backup (criação)

### Manual
1. Usuário acessa `/configuracoes/backup` → seleciona módulos → clica **Gerar backup agora**.
2. Frontend monta JSON consultando as tabelas dos módulos selecionados (escopo `owner_group_id`).
3. Faz upload em `backups/{user_id}/{timestamp}.json` e insere linha em `backups` com `origem='manual'`.
4. Trigger pós-insert (ou chamada explícita) replica para o Cofre via `service_role`.

### Agendado
1. Cron diário invoca `executar-backups-agendados`.
2. Para cada `backup_agendamentos` ativo:
   - Gera JSON dos `modulos` configurados.
   - Salva em `backups` (`origem='agendado'`).
   - Espelha em `backups_cofre` marcando `eh_mensal=true` se hoje for dia 1.
3. Aplica retenção:
   - **Backups do usuário:** apaga registros + objetos mais antigos que `retencao_dias`.
   - **Cofre:** mantém todos com `eh_mensal=true` + os 5 mais recentes por `owner_group_id`. Remove o resto (banco + storage).

---

## 4. Fluxo de Restauração — passo a passo

### 4.1 Restauração de backup existente (próprio usuário)

1. Acessa `/configuracoes/backup` → aba **Histórico** → clica **Restaurar** num backup.
2. Abre `RestaurarBackupDialog` em **Etapa 1 — Impacto**:
   - Mostra: data do snapshot, módulos cobertos, lista de tabelas que serão sobrescritas.
   - Aviso em coral: "Esta ação é irreversível e substituirá os dados atuais."
   - Checkbox obrigatório: *"Entendi que esta ação é irreversível."*
   - Botão **Continuar** habilita apenas com o checkbox marcado.
3. **Etapa 2 — Confirmação por palavra-chave**:
   - Exibe a palavra exata a digitar: `RESTAURAR {nome_do_backup}` (ex.: `RESTAURAR Backup_2026-05-20`).
   - Input controlado — botão **Restaurar definitivamente** (coral) só habilita com match 100%.
4. Frontend chama Edge `restaurar-backup` com `{ backup_id, confirmacao }`.
5. Edge function:
   - Valida JWT do chamador.
   - Re-valida a string `confirmacao` server-side (defesa contra bypass de UI).
   - Resolve `owner_group_id` do chamador.
   - Baixa JSON do bucket `backups`.
   - Para cada tabela permitida, em ordem reversa de FK: `DELETE WHERE owner_group_id = $1`.
   - Em ordem normal de FK: `INSERT` em lotes de 500 linhas.
   - **Tabelas protegidas (nunca apagadas):** `profiles` (apenas UPDATE), `groups`, `user_group_roles`, `admin_logs`, qualquer schema `auth.*`.
6. Registra evento em `admin_logs` (`acao='backup_restaurado'`).
7. Retorna `{ ok: true, tabelas_restauradas, linhas_inseridas }`.
8. UI exibe toast de sucesso e força reload.

### 4.2 Restauração via arquivo `.json` (upload)

Mesmo fluxo de UI (Etapa 1 + Etapa 2), mas envia `{ dados: <json>, confirmacao }` em vez de `backup_id`. Server faz validação de schema do JSON antes de prosseguir.

### 4.3 Restauração pelo Cofre (MOTHER — suporte)

1. MOTHER acessa `/admin/cofre-backups`.
2. Lista todos os backups do Cofre, agrupados por `owner_group_id` (com nome do grupo).
3. Pode **Baixar** (download direto do JSON via signed URL service_role) ou **Restaurar**.
4. Ao restaurar:
   - Mesmo modal de dupla confirmação (`RESTAURAR {nome}`).
   - Edge function recebe flag `via_cofre=true` + `target_group_id`.
   - Valida role MOTHER server-side.
   - Executa restauração no grupo alvo (não no grupo do MOTHER).
   - Loga em `admin_logs` com `observacao='Restauração via suporte MOTHER'`.

---

## 5. Exemplos de payload

### Request `restaurar-backup` (próprio)
```json
{
  "backup_id": "f3a2...",
  "confirmacao": "RESTAURAR Backup_2026-05-20"
}
```

### Request `restaurar-backup` (MOTHER via Cofre)
```json
{
  "cofre_id": "c12...",
  "target_group_id": "g99...",
  "confirmacao": "RESTAURAR Backup_2026-05-20",
  "via_cofre": true
}
```

### Response sucesso
```json
{
  "ok": true,
  "tabelas_restauradas": ["encomendas","encomenda_itens","tags","..."],
  "linhas_inseridas": 1284,
  "duracao_ms": 4210
}
```

### Response erro (palavra-chave incorreta)
```json
{ "ok": false, "erro": "confirmacao_invalida" }
```

---

## 6. Restrições de segurança

- Palavra-chave é **revalidada no servidor** — UI sozinha não autoriza.
- `auth.users`, `groups`, `user_group_roles` e `admin_logs` nunca são tocados.
- `profiles` aceita apenas UPDATE de campos não-sensíveis (nome, telefone, etc.); planos e roles são protegidos por trigger.
- Cofre só é legível/restaurável por MOTHER — RLS + checagem na Edge Function.
- Todas as restaurações geram entrada em `admin_logs` (ator, grupo, backup, timestamp).

---

## 7. Política de retenção do Cofre (resumo)

```
mantém_no_cofre = (eh_mensal = true) OR (rank por criado_em desc <= 5)
```

- Backup do dia 1 de cada mês é marcado `eh_mensal=true` e nunca expira automaticamente.
- Os 5 backups mais recentes (rolling, atualizados diariamente) sempre ficam disponíveis.
- Demais são apagados de `backups_cofre` e do bucket `backups-cofre`.

---

## 8. Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| Botão **Restaurar definitivamente** não habilita | Palavra-chave digitada com diferença (espaço, acento) | Conferir match exato, inclusive maiúsculas |
| Edge retorna `confirmacao_invalida` | UI burlada ou string com whitespace extra | Confiar na validação server-side, recarregar modal |
| Edge retorna `forbidden` em fluxo Cofre | Usuário não é MOTHER | Verificar `user_group_roles` |
| Restauração parcial | Erro no meio do batch | Checar `admin_logs` + logs da Edge; rodar nova restauração |
| Cofre vazio para um grupo | Nenhum backup bem-sucedido ainda foi espelhado | Rodar backup manual; verificar logs de `executar-backups-agendados` |

---

## Local de salvamento dos arquivos (2026-05-28)

Implementado o seletor de **pasta local** para os arquivos `.json` de backup.

- **UI:** `src/pages/configuracoes/Backup.tsx` — novo card "Local de salvamento" entre "Sobre os backups" e "Backup manual".
- **Utilitário:** `src/lib/backupLocation.ts` — usa a **File System Access API**
  (`window.showDirectoryPicker`) e persiste o `FileSystemDirectoryHandle` em
  IndexedDB (`cda-backup-prefs/handles/backupFolder`). Nome amigável da pasta
  fica em `localStorage` (`cda:backup:folderName`).
- **Comportamento:**
  - Se a usuária escolheu uma pasta → grava o arquivo direto nela via
    `getFileHandle({ create: true })` + `createWritable()`.
  - Caso a permissão tenha sido revogada, requisita novamente.
  - Sem pasta configurada **ou** navegador sem suporte (Firefox/Safari) →
    fallback para download tradicional (pasta Downloads do navegador).
- **Aplicado em:** `realizarBackup()` e `downloadBackup()` (histórico).
- **Sem impacto em RLS, Edge Functions ou SQL** — alteração 100% client-side.
