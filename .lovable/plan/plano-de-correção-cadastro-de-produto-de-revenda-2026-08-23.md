# Plano de Correção: Cadastro de Produto de Revenda

O usuário reportou erro ao salvar produtos de revenda. A análise indica uma possível falha na injeção do `owner_group_id` ou tratamento de campos obrigatórios no formulário e no hook de mutação, o que causa violações de RLS (Row Level Security) ou erros de integridade.

## Alterações Técnicas

### Frontend

- **src/components/ProdutoRevendaForm.tsx**:
  - Limpar campos nulos ou vazios antes de enviar para evitar erros de tipo UUID no banco (ex: `categoria_id` sendo string vazia).
  - Garantir que `preco` e `preco_venda` sejam convertidos para número se chegarem como string.
  - Remover `id` do payload se for `'temp-id'`.

- **src/hooks/useProdutosRevenda.ts**:
  - Validar a presença de `activeGroupId` e `userId` na mutação de criação e atualização.
  - Refinar o tratamento de erro para exibir mensagens mais claras vindas do backend.

- **src/hooks/useCategorias.ts**:
  - Adicionar o `owner_group_id` explicitamente na criação de categorias para evitar falhas de RLS em fluxos integrados.

### Backend (SQL/RLS)

- Verificar se a política de RLS em `produtos_revenda` está permitindo `INSERT` com o `owner_group_id` correto (a auditoria anterior já confirmou a política, mas a mutação precisa enviar o dado correspondente).

## Verificação

1. Criar um produto de revenda via formulário manual.
2. Criar um produto de revenda via modal de "Busca por código" em Fichas Técnicas.
3. Verificar logs do console e rede para garantir que o payload contém `owner_group_id` e `usuario_id`.
