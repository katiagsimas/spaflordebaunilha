# Plan: Stock Module Refinements and Integration

Refine the Stock module with automated cost calculations, price synchronization with other modules, and enhanced list management.

## 1. Stock Entry Refinements (EstoqueEntrada.tsx)
- Add a "Preço do Produto (Embalagem)" field to the entry form.
- Automate "Custo Total" calculation: `(Product Price / Package Quantity) * Quantity Purchased`.
- Fix "Unit Cost" calculation display to show cost per base unit (e.g., cost per gram).
- Add a confirmation dialog/toggle: "Atualizar preço em Insumos, Pré-Preparo e Ficha Técnica?".
- If confirmed, update the `preco` in `ingredientes` or `embalagens` tables upon successful entry registration.

## 2. Stock Dashboard Actions (EstoqueDashboard.tsx)
- Add an "Ações" column to the stock items table.
- Implement a vertical 3-dots menu for each item.
- Actions:
  - **Editar**: Dialog to manually adjust `quantidade_atual`.
  - **Excluir**: Remove the item from stock.
  - **Duplicar**: Create a new stock record based on the selected one.
- Allow editing of quantity and unit of measurement for existing items.

## 3. Module Organization (Precificacao.tsx)
- Ensure the "Pré-Preparo" card is visible in the "Serviços" (Precificacao) module.

## Technical Details
- Update `registrarEntrada` in `useEstoque.ts` if needed to handle any new parameters.
- Add `updateInsumoPrice` utility to handle cascading price updates.
- Use `shadcn` components for new UI elements (Dialog, DropdownMenu).
- Ensure RLS compliance by passing `owner_group_id` to all database updates.
