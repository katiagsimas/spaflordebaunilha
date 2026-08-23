# Plano de Refinamento do Estoque

A usuária solicitou melhorias na listagem do Estoque (chamada na tela de "Histórico de Movimentações") e no fluxo de edição de itens.

## Alterações propostas

### Frontend

1.  **EstoqueDashboard.tsx**
    *   Adicionar nova coluna "Total Itens" no cabeçalho da tabela entre "Valor no Estoque" e "Status / Mínimo".
    *   Exibir a `quantidade_atual` formatada com a unidade de medida nessa nova coluna.
    *   Alterar a ação "Editar" no menu de ações para navegar para `/estoque/entrada?edit={id}` em vez de abrir o modal de edição simplificado.
    *   Remover o modal de edição simplificado e estados relacionados que não serão mais usados.

2.  **EstoqueEntrada.tsx**
    *   Adaptar o formulário para suportar o modo de edição quando o parâmetro `edit` estiver presente na URL.
    *   Carregar os dados do item de estoque (quantidade, preço da embalagem, etc.) para preenchimento prévio.
    *   No modo edição, a submissão deve atualizar o registro existente em vez de criar uma nova movimentação de entrada (ou conforme a regra de negócio, ajustar a movimentação original se possível, mas geralmente no estoque atualizamos o saldo e registramos o ajuste).
    *   *Nota*: A usuária mencionou "alterar a quantidade comprada, quantidade na embalagem e Preço de Venda". Isso implica que a edição atua sobre os dados que definem o custo e saldo do item.

## Detalhes Técnicos

*   Utilizar `useSearchParams` do `react-router-dom` em `EstoqueEntrada.tsx` para detectar o ID do item.
*   Garantir que a lógica de cálculo de custo unitário seja mantida na edição.

## Auditoria e Segurança
*   As permissões de RLS já cobrem edição pelo `owner_group_id`.
*   Registrar a alteração no `AUDITORIA.md`.
