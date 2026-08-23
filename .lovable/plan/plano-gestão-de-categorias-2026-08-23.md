# Plano: Gestão de Categorias

Implementar a funcionalidade de criação, edição e exclusão de categorias no módulo de Cadastros, garantindo uma interface minimalista e ações diretas.

## Alterações

### Frontend

- **Página de Categorias (`src/pages/cadastros/Categorias.tsx`)**:
    - Adicionar botão **"Nova Categoria"** no cabeçalho.
    - Implementar diálogo (modal) minimalista para criação e edição de categoria (apenas campo Nome).
    - Adicionar coluna **"Ações"** na tabela com menu dropdown (três pontinhos):
        - Ação **Editar**: Abre o modal com os dados carregados.
        - Ação **Excluir**: Realiza a exclusão após confirmação (via `deleteCategoria` do hook).
    - Integrar chamadas do hook `useCategorias` (`createCategoria`, `updateCategoria`, `deleteCategoria`).

### Backend

- Não são necessárias alterações no backend, pois o hook `useCategorias` e as políticas RLS já existem e suportam as operações solicitadas.

## Detalhes Técnicos

- Utilizar componentes da biblioteca UI: `Dialog`, `DropdownMenu`, `Button`, `Input`, `Label`.
- Ícone `MoreVertical` para o menu de ações.
- Validação básica para impedir nomes vazios.
- Feedback visual via `toast` para todas as ações (sucesso/erro).
