# Fix Registration Issues (RLS/owner_group_id)

The user is reporting registration errors in the "Cadastros" module. My investigation revealed that several registration tables have RLS policies requiring a non-null `owner_group_id`, but many frontend hooks and components are not providing this field during insert operations.

## Proposed Changes

### 1. Frontend Hooks and Components
- Update `src/hooks/useCategorias.ts` to include `owner_group_id` using `useGroup`.
- Update `src/hooks/useUnidadesMedida.ts` to include `owner_group_id`.
- Update `src/pages/configuracoes/Bancos.tsx` to include `owner_group_id` (this one uses `supabase` directly).
- Update `src/components/CriarIngredienteModal.tsx` and `src/components/CriarEmbalagemModal.tsx` to accept and use `activeGroupId`.

### 2. Database Cleanup (Supabase Migration)
- Identify records in `categorias`, `unidades_medida`, `bancos`, `tipos_insumos`, `ingredientes`, and `embalagens` where `owner_group_id` is NULL.
- Update these records to point to the correct `owner_group_id` based on the `usuario_id` (looking up the user's primary group).

## Technical Details
- RLS Policy Example: `((owner_group_id IS NOT NULL) AND user_belongs_to_group(auth.uid(), owner_group_id))`
- The fix involves fetching `activeGroupId` from `GroupContext` and passing it to all `.insert()` calls.
