## Objetivo

1. Transformar **Restaurar Backup** numa operação real (hoje é stub), com **dupla confirmação por digitação** no estilo Vercel/GitHub.
2. Criar um **Cofre de Backups** paralelo ao histórico do usuário, fora da rotina de exclusão por retenção do usuário, acessível apenas ao MOTHER para suporte.

---

## Parte 1 — Restauração real com dupla confirmação

### UI (tela `/configuracoes/backup`)

Substituir o stub atual por um modal de duas etapas (reutilizável tanto para restauração via histórico quanto via upload de arquivo `.json`):

**Etapa 1 — Aviso de impacto**
- Mostra: data do snapshot, módulos incluídos, lista do que será sobrescrito.
- Aviso destacado em coral: *"Todos os dados criados ou alterados após [data] serão perdidos e não poderão ser recuperados."*
- Checkbox obrigatório: *"Entendo que esta ação é irreversível."*
- Botão "Continuar" só habilita após marcar o checkbox.

**Etapa 2 — Digitação da palavra-chave**
- Campo de texto pedindo para digitar exatamente: `RESTAURAR [nome-do-backup]`
- Botão "Restaurar definitivamente" (coral) só habilita quando o texto bate 100%.
- Loader durante execução com aviso *"Restaurando… não feche esta janela."*

### Backend — nova Edge Function `restaurar-backup`

- Recebe: `{ backup_id }` (do histórico) **ou** `{ dados }` (upload) + `{ confirmacao }` (a palavra digitada).
- Valida JWT do chamador e **revalida** a palavra-chave server-side (defesa em profundidade).
- Resolve `owner_group_id` do usuário autenticado.
- Carrega o JSON (Storage ou body).
- Para cada tabela presente no snapshot, na ordem correta de FKs:
  1. `DELETE FROM <tabela> WHERE owner_group_id = $1`
  2. `INSERT` em lotes do snapshot, ignorando linhas de outros grupos por segurança.
- **Restrições**:
  - `profiles`: nunca apaga, apenas `UPDATE` campo a campo (não pode quebrar o auth).
  - `user_group_roles`, `groups`, `user_global_roles`: **bloqueadas** da restauração (risco de o usuário se trancar fora).
  - `admin_logs` e schema `auth.*`: nunca tocadas.
  - Só restaura tabelas que aparecem no `backupCatalog` dos módulos do snapshot.
- Loga em `admin_logs`: ator, backup_id, módulos, contagem por tabela, duração.
- Retorna resumo (tabelas restauradas, registros por tabela, avisos).

---

## Parte 2 — Cofre de Backups (suporte MOTHER)

### Política de retenção (confirmada)

Para cada `owner_group_id`:
- **Sempre manter** o backup do **dia 1 de cada mês** (snapshot mensal permanente).
- **Sempre manter** os **5 backups mais recentes** (rolling, atualizados diariamente).
- Tudo o que não cair em uma dessas duas regras é apagado do cofre.

### Implementação

1. **Bucket de Storage `backups-cofre`** — privado, acessível apenas via service_role.

2. **Tabela `backups_cofre`** — espelho de `backups`:
   - Campos: `owner_group_id`, `usuario_id_origem`, `nome`, `modulos`, `storage_path`, `tamanho_bytes`, `criado_em`, `origem` (manual/agendado), `backup_id_origem`, `eh_mensal` (boolean: true se foi gerado no dia 1).
   - RLS: **apenas MOTHER lê**. Nenhum usuário comum acessa, nem o criador.

3. **Hook automático** em `executar-backups-agendados` (e no fluxo manual de backup):
   - Após gerar com sucesso, **copia** o arquivo para `backups-cofre` e insere registro em `backups_cofre` (marca `eh_mensal = true` se for dia 1 do mês).
   - Aplica a política do cofre: apaga do cofre tudo do mesmo grupo que **não** seja `eh_mensal = true` **e** não esteja entre os 5 `criado_em` mais recentes.

4. **Tela "Cofre de Backups"** dentro de Governança (`/admin/cofre-backups`, só MOTHER):
   - Adicionar card "Cofre de Backups" em `src/pages/admin/Governanca.tsx`.
   - Listagem de todos os backups, filtros por grupo, usuário, data, módulo, mensal/recente.
   - Ações: **baixar JSON** e **restaurar para o grupo de origem** (reusa a Edge Function `restaurar-backup`, executada com identidade MOTHER apontando para o `owner_group_id` do snapshot).
   - Restaurações via cofre passam pelo **mesmo modal de dupla confirmação** e ficam registradas em `admin_logs` com nota "restauração via suporte MOTHER".

---

## Detalhes técnicos

### Arquivos a criar
- `supabase/functions/restaurar-backup/index.ts`
- `src/components/backup/RestaurarBackupDialog.tsx` (modal duas etapas, reutilizável)
- `src/pages/admin/CofreBackups.tsx`

### Arquivos a editar
- `src/pages/configuracoes/Backup.tsx` — substituir `restaurarDoHistorico` e `handleRestaurarArquivo` pela chamada à Edge Function via novo dialog; remover toast "requer suporte técnico".
- `supabase/functions/executar-backups-agendados/index.ts` — após upload do backup, espelhar no cofre + aplicar retenção do cofre.
- `src/pages/admin/Governanca.tsx` — adicionar card "Cofre de Backups".
- `src/App.tsx` — registrar rota `/admin/cofre-backups` (MOTHER only).
- `src/components/AppSidebar.tsx` — opcional: link rápido em Governança (só MOTHER).

### Migrações SQL
- `CREATE TABLE public.backups_cofre (...)` + GRANTs + RLS (somente MOTHER lê/escreve via service_role).
- `INSERT INTO storage.buckets (id, name, public) VALUES ('backups-cofre', 'backups-cofre', false)` + políticas restritas a service_role.
- Índices em `(owner_group_id, criado_em DESC)` e `(owner_group_id, eh_mensal)` para a lógica de retenção.

### Documentação (`docs/`)
- `AUDITORIA.md`: registrar restauração real, cofre, RLS, novo bucket.
- Criar `docs/DOCS_BACKUP_RESTORE.md` com: fluxo de restauração, ordem de tabelas, regras de segurança, política do cofre.

---

## Pontos de atenção

- **Ordem de FKs**: levantar a ordem real a partir do schema antes de codificar (errar quebra a restauração). Tabelas pais primeiro no INSERT, filhos primeiro no DELETE.
- **Tamanho/tempo**: backups grandes podem estourar o tempo da Edge Function. Mitigação: processar em lotes de 500 linhas por INSERT e retornar progresso.
- **Custo de Storage**: o cofre cresce ~5 + 12/ano por grupo (linear e controlado pela política).
- **Acesso à restauração**: continua disponível a **qualquer usuário** sobre **seus próprios backups** (você confirmou). O cofre é só para suporte MOTHER.

---

Posso seguir com a implementação nessa ordem: (1) migração SQL do cofre, (2) Edge Function `restaurar-backup`, (3) hook do cofre no `executar-backups-agendados`, (4) UI (modal + tela do cofre), (5) docs?
