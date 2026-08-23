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