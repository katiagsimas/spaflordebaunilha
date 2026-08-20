# Plan: Remove Access Plans from Project

Remove all logic, constraints, and database references related to "Access Plans" (Lite, Business, etc.), effectively giving all users full access to all features.

## Technical Details

### Backend Changes

1.  **PostgreSQL Migration**:
    *   Drop tables: `planos`, `historico_planos`, `member_plan_sync_logs`.
    *   Delete plan-related columns from `profiles`: `plano_id`, `plano_inicio`, `plano_fim`, `plano_tipo`, `plano_pendente_id`, `plano_pendente_tipo`, `plano_pendente_inicio`, `plano_pendente_fim`.
    *   Delete plan-related columns from `hotmart_produtos`: `plano_id`, `plano_tipo`.
    *   Note: `plano_conta_id` in financial tables is NOT related to access plans; it refers to the "Chart of Accounts" (Plano de Contas) and will be kept.

### Frontend Changes

1.  **Remove Plan Guards**:
    *   Delete `src/components/PlanoGuard.tsx`.
    *   Remove `<PlanoGuard>` wrappers from all routes in `src/App.tsx`.
    *   Delete `src/components/AlertaExpiracaoPlano.tsx` and `src/components/PlanExpirationWatcher.tsx`.
    *   Remove their usage in `src/App.tsx`.
2.  **Clean up Hooks and Contexts**:
    *   Delete `src/hooks/usePlano.ts`.
    *   Delete `src/lib/planos.ts`.
    *   Delete `src/components/MotherPlanSelector.tsx`.
    *   Update `src/components/AppSidebar.tsx` to remove plan-based locking logic and upgrade modals.
    *   Update `src/components/UserMenu.tsx` to remove mentions of plans.
3.  **Clean up Admin Dashboards**:
    *   Update `src/pages/admin/Usuarios.tsx` to remove plan-related stats and columns.
    *   Update `src/components/admin/CriarUsuarioDialog.tsx` and `src/components/admin/EditarUsuarioDialog.tsx` to remove the plan selector.
4.  **Clean up Webhooks**:
    *   Update `supabase/functions/hotmart-webhook/index.ts` to remove plan provisioning logic.
    *   Update `supabase/functions/criar-usuario/index.ts` to remove plan-related fields.

### User Impact
*   All users will have total access to all modules (Financeiro, Comercial, Estoque, etc.).
*   No more expiration alerts or "upgrade needed" modals.
