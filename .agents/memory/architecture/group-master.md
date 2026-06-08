---
name: Group Master concept
description: Cada grupo tem um master_user_id (mestre) que faz o onboarding e cujos dados base + plano são herdados pelos membros
type: feature
---

Cada `groups` tem `master_user_id` (FK auth.users) — o usuário "dono" do grupo.

- Mestre = ADMIN principal, faz onboarding (BemVinda → Meus Dados → Mão Obra → Backup → Concluído), tem plano próprio.
- Membro (USER ou ADMIN secundário) = pula onboarding (`onboarding_concluido=true` ao ser criado), herda `plano_id/tipo/inicio/fim` do mestre via `usePlano` (lê do `master_user_id` quando `active_group_id` aponta para grupo onde o usuário não é mestre).
- MOTHER pode ser adicionada a grupos como ADMIN ou USER (escolher ao adicionar). Sempre tem acesso total via mother-mode.

UI:
- `useIsGroupMaster()` → `{ isMaster, isMember, masterId, masterEmail, masterName }`. MOTHER conta como mestre.
- `<MasterOnlyGuard recurso="...">` → mostra card "gerenciado pelo mestre" se não-mestre.
- Páginas com guard: `SeusDados`, `MaoDeObra`, `Backup`.

Edge function `criar-usuario` aceita: `tipoUsuario: 'mestre'|'membro'`, `groupId`, `roleGroup: 'ADMIN'|'USER'`, `permissionFlags`. Mestre cria grupo novo + plano. Membro vincula a `groupId`, sem plano, com sessão ativa setada.

GruposManager:
- Badge "Mestre" (Crown dourado) destaca o `master_user_id`.
- Mestre não pode ser removido, desativado, ou rebaixado para USER (validado em UI).

Funções SQL: `is_group_master`, `get_group_master`, `user_is_any_group_master`.
