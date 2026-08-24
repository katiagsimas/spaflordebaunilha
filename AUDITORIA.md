# Auditoria de Alterações - Spa Flor de Baunilha

## 24/08/2026 - Módulo de Vendas (UX e Persistência)

### Problema: Desaparecimento de Venda ao Alterar Status
O usuário relatou que ao alterar o status de uma venda de "Pendente" para "Confirmada", ela desaparecia da visualização.

### Diagnóstico:
O comportamento era causado pelos filtros de status da interface. Ao navegar em `/encomendas/lista/pendentes`, apenas registros com status "pendente" são exibidos. Ao atualizar o status, o registro deixa de atender ao critério da listagem e é removido da tela, causando a percepção de erro ou perda de dados.

### Solução:
1.  **Feedback Visual Aprimorado:** Adicionada notificação (toast) informativa em `src/pages/Encomendas.tsx` que avisa ao usuário quando um status é alterado e informa que o registro será movido para a aba correspondente.
2.  **Confirmação de Integridade:** Verificado via SQL que a persistência está ocorrendo corretamente.
3.  **Redirecionamento:** Sugerido ao usuário observar as abas de filtro por status ou o período (Mês/Ano) selecionado.

---

## Histórico Anterior

### Correção de Esquema - Receitas
O erro "Could not find the modo_preparo column of the pre_preparos in the schema cache" ocorreu porque o sistema estava tentando salvar dados em colunas que foram renomeadas durante o rebranding recente (de "pré-preparos" para "receitas").

Corrigi os arquivos `src/pages/precificacao/ReceitaForm.tsx` e `src/pages/precificacao/Receitas.tsx` para utilizarem os novos nomes de colunas:
- `tempo_preparo` -> `tempo_receita`
- `modo_preparo` -> `modo_receita`

A persistência no banco de dados agora está alinhada com o esquema atual.

Resumo das correções:
1. Atualizado `ReceitaForm.tsx` para remover referências à coluna inexistente `modo_preparo` no objeto de salvamento.
2. Atualizado `Receitas.tsx` para exibir corretamente o tempo de preparo usando a nova coluna.
3. Verificado o esquema do banco de dados para garantir compatibilidade.

O sistema de receitas e fichas técnicas está operacional.