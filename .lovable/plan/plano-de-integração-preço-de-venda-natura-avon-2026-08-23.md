# Plano de Integração: Preço de Venda Natura/Avon

Integração do novo campo `preco_venda` (Preço de Venda) dos produtos de revenda nos fluxos financeiros e de precificação.

## Alterações Realizadas
- Adicionada coluna `preco_venda` na tabela `public.produtos_revenda` e `public.ingredientes`.
- Atualizado o formulário de Cadastro de Revenda para suportar Custo vs. Venda.
- Sincronização automática do preço de venda ao importar/buscar produtos por código.
- Implementação da busca por código em **Contas a Receber** (entradas de dinheiro) e **Contas a Pagar** (saídas/compras).

## Próximos Passos
1. **Sincronização na Ficha Técnica**: Garantir que se a Ficha Técnica for um produto de revenda puro, o `valor_venda` da ficha seja atualizado se o usuário optar por sincronizar o preço global.
2. **Dashboard Financeiro**: Utilizar os dados de `preco_venda` para projetar faturamento esperado no estoque.

## Detalhes Técnicos
- SQL: `ALTER TABLE ingredientes ADD COLUMN preco_venda NUMERIC(10,2)`.
- Lib: `src/lib/produtoRevenda.ts` agora retorna e atualiza `preco_venda`.
- UI: Componente `BuscarProdutoRevenda.tsx` injetado nos modais financeiros.
