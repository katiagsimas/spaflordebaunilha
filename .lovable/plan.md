I will remove the multi-user and group management features to restrict each group to a single "Master" user.

### UI Changes
- **Governanca Page:** Remove the "Usuários" card and any references to managing members or permissions.
- **GruposManager Component:** Disable or remove the "Ver membros" and "Adicionar membro" functionality.
- **PermissionGuard Component:** Simplify logic to focus on whether a user is the owner/master of the current group.
- **Navigation/Settings:** Remove links to "Usuários" or "Governança" from general user menus, keeping it only for system administrators (MOTHER role).

### Backend/Logic Changes
- **Edge Functions (criar-usuario):** Update to prevent the creation of "membro" type users. Only "mestre" users (new accounts) will be allowed.
- **Database Policies:** Ensure that Row Level Security (RLS) strictly enforces that only the `master_user_id` can access group data.

### Technical Details
- Modify `src/pages/admin/Governanca.tsx` to hide the member management card.
- Modify `src/components/admin/GruposManager.tsx` to remove member listing and invitation buttons.
- Update `supabase/functions/criar-usuario/index.ts` to reject `tipoUsuario: 'membro'`.
- Review `src/contexts/GroupContext.tsx` to ensure `canManageUsers` and similar helpers reflect this new single-user-per-group policy.
