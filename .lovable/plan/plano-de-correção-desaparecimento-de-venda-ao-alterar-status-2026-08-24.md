# Plano de Correção: Desaparecimento de Venda ao Alterar Status

O usuário relatou que ao alterar o status de uma venda de "Pendente" para "Confirmada", ela desaparece da listagem. Isso ocorre devido ao filtro de status aplicado na interface, que isola os registros por categoria.

## Problema Identificado

1.  **Filtros de Rota e Componente:** O sistema utiliza rotas como `/encomendas/lista/pendentes` ou `/encomendas/lista/confirmadas`. Ao alterar o status de um registro, ele deixa de atender ao critério da listagem atual (`statusKey`) e é removido da visualização imediata.
2.  **Percepção do Usuário:** O desaparecimento repentino sem uma mensagem explicativa ou redirecionamento causa a sensação de perda de dados.

## Alterações Propostas

### Frontend

1.  **Refinamento do `EncomendaStatusCard.tsx`:**
    *   Adicionar um feedback visual (toast) informando que o registro foi movido para outra categoria de status após a atualização.
    *   Garantir que a invalidação da query do React Query ocorra corretamente para refletir a mudança em todas as abas.

2.  **Refinamento em `Encomendas.tsx`:**
    *   Garantir que ao salvar uma edição de status, o sistema forneça feedback claro de que a venda agora pertence a um novo grupo de status.

### Backend

1.  **Verificação de Persistência:**
    *   Confirmar se a atualização de status está sendo persistida corretamente no banco de dados (já confirmado via query SQL que os dados estão íntegros).

## Detalhes Técnicos

*   Arquivo `src/components/encomendas/EncomendaStatusCard.tsx`: Monitorar mudanças na lista filtrada para detectar quando um item "sai" da lista devido a alteração de status e notificar o usuário.
*   Arquivo `src/pages/Encomendas.tsx`: Adicionar notificação específica quando o status é alterado durante a edição.

## Auditoria e Documentação

*   Registrar a correção em `AUDITORIA.md` sob a seção de Refinamentos de UX do Módulo de Vendas.
