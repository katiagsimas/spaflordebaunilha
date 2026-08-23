# Plano: Filtros de Categoria e Integração em Revenda

Aprimorar a listagem de categorias com busca e filtros, e integrar a seleção de categorias nos formulários de produtos de revenda (Natura/Avon).

## Alterações

### Frontend

1.  **Listagem de Categorias (`src/pages/cadastros/Categorias.tsx`)**:
    *   Verificar se a busca e o filtro de status já estão funcionais (foram adicionados no passo anterior).
    *   Garantir que a busca filtre em tempo real pelo nome da categoria.

2.  **Formulário de Produtos para Revenda (`src/components/ProdutoRevendaForm.tsx`)**:
    *   Verificar a integração do campo "Categoria" (Select) com as `categoriasAtivas` do hook `useCategorias`.
    *   Confirmar se o valor está sendo persistido corretamente no campo `categoria_id` do objeto `ProdutoRevenda`.

3.  **Listagem de Produtos de Revenda (`src/pages/MarcaRevendaPage.tsx`)**:
    *   Adicionar coluna "Categoria" na tabela para exibir o nome da categoria associada ao produto.
    *   Adicionar um filtro de Categoria no topo da listagem para permitir filtrar produtos por categoria específica.
    *   Integrar o hook `useCategorias` para carregar as opções do filtro.
    *   Atualizar a lógica de exportação (CSV/PDF) para incluir a categoria.

### Backend

*   Não são necessárias alterações no backend, pois a coluna `categoria_id` já deve existir na tabela `produtos_revenda` (conforme verificado no código do formulário).

## Detalhes Técnicos

*   Uso de `useMemo` para filtragem eficiente no frontend.
*   Tratamento de casos onde o produto não possui categoria associada (exibição de "-").
*   Manutenção do estilo visual SFB (Terracota/Baunilha).
