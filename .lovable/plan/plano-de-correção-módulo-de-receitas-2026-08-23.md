# Plano de Correção: Módulo de Receitas

Corrigir o erro "undefined" no tempo de preparo da listagem de receitas e a falha de carregamento ao tentar editar uma receita.

## Problema Identificado

1.  **Tempo de Receita "undefined"**: O sistema está tentando exibir `tempo_receita` e `tempo_receita_unidade` que são campos da tabela `pre_preparos`, mas a listagem pode estar esperando nomes de campos diferentes ou a unidade está nula.
2.  **Erro ao Editar**: A rota de edição para receitas aponta para `/cadastros/receitas/:id`, que carrega o componente `ReceitaForm.tsx` (da pasta `precificacao`). Este componente tenta buscar dados da tabela `pre_preparos` e suas relações, mas o seletor da query no `fetchReceita` está incorreto para a relação de ingredientes (`pre_receitas_ingredientes` vs `pre_preparos_ingredientes`).

## Mudanças Propostas

### Frontend

1.  **src/pages/precificacao/Receitas.tsx**:
    *   Revisar a função `formatarTempo` para garantir que lide com valores nulos ou indefinidos.
    *   Verificar se o objeto `receita` retornado pela query do Supabase contém os campos esperados.

2.  **src/pages/precificacao/ReceitaForm.tsx**:
    *   Corrigir a query no método `fetchReceita` (linhas 224-246) para usar o nome correto da relação de ingredientes: mudar de `pre_receitas_ingredientes` para `pre_preparos_ingredientes`.
    *   Ajustar o mapeamento de ingredientes (linhas 260-270) para garantir compatibilidade com a estrutura retornada.
    *   Garantir que o `tempo_receita_unidade` seja tratado corretamente se estiver nulo no banco.

3.  **src/hooks/useCalculosReceita.ts**:
    *   Garantir que os campos `tempoPreparo` e `unidadeTempo` sejam mapeados corretamente no hook que alimenta a listagem principal de receitas.

## Verificação Técnica

1.  Validar se a tabela `pre_preparos` no backend tem os campos `tempo_receita` e `tempo_receita_unidade`.
2.  Testar o carregamento da lista de receitas e verificar se o tempo aparece corretamente (ex: "30 minutos").
3.  Testar a abertura do formulário de edição para uma receita existente e confirmar que os dados são carregados sem erros.
