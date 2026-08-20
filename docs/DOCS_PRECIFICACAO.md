# 🧮 DOCUMENTAÇÃO: Módulo de Precificação — Spa Flor de Baunilha

**Atualizada em:** 26/05/2026

---

## 1. VISÃO GERAL

Módulo para cálculo de custos e formação de preços. Acessível no **Flor de Baunilha Lite**.

### Cadeia de Precificação
```
Tipos de Insumos (config)
       │
       ▼
┌──────┴──────┐
│             │
▼             ▼
Ingredientes  Embalagens
│             │
└──────┬──────┘
       │
       ▼
  Pré-Preparos (opcional)
       │
       ▼
    Receitas ◄── Mão de Obra (Perfis)
       │
       ▼
  Valor de Venda
       │
       ▼
   Encomendas
```

---

## 2. TIPOS DE INSUMOS

**Tabela:** `tipos_insumos`
- `descricao`, `tipo` ('ingrediente', 'embalagem', 'outro')
- `quantidade_embalagem`, `unidade_medida_id`
- `pre_preparo_id` (se o insumo é um pré-preparo)
- `owner_group_id`

**Configuração:** `/configuracoes/tipos-insumos`

---

## 3. INGREDIENTES

**Tabela:** `ingredientes`
- `tipo_insumo_id` → FK tipos_insumos
- `preco` (preço da embalagem)
- `marca`, `categoria`
- `e_pre_preparo` (boolean)
- `data_atualizacao`

**Rota:** `/precificacao/ingredientes`  
**Cálculo:** Custo unitário = preco / quantidade_embalagem (do tipo_insumo)

---

## 4. EMBALAGENS

**Tabela:** `embalagens`
- `tipo_insumo_id` → FK tipos_insumos
- `preco`, `marca`
- `data_atualizacao`

**Rota:** `/precificacao/embalagens`

---

## 5. PRÉ-PREPAROS

**Tabela:** `pre_preparos`
- `nome`, `tempo_preparo` (em minutos), `tempo_preparo_unidade` ('minutos' ou 'horas')
- `rendimento_quantidade`, `rendimento_unidade_id`
- `custo_total`, `custo_por_unidade`
- `categoria_id`, `modo_preparo`
- `imagem_1_url`, `imagem_2_url`

**Tabela:** `pre_preparos_ingredientes`
- `ingrediente_id`, `quantidade_utilizada`, `custo_ingrediente`, `ordem`

**Tabela:** `pre_preparos_mao_obra`
- `perfil_id`, `horas` (em horas decimais), `usar_valor_padrao`

### Tempo de Preparo
O campo "Tempo de Preparo" trabalha exclusivamente em **minutos** e **horas** (não em horas decimais). A mão de obra é lançada com campos separados de horas e minutos que são convertidos para o total em minutos. O tempo total é calculado a partir da soma das horas de mão de obra vinculadas e salvo no cadastro.

**Rotas:**
- `/precificacao/pre-preparos` — Listagem
- `/precificacao/pre-preparos/novo` — Criar
- `/precificacao/pre-preparos/:id` — Editar

---

## 6. RECEITAS (Fichas Técnicas)

**Tabela:** `receitas`
- `nome`, `categoria`, `tipo`
- `tempo_preparo`, `unidade_tempo`
- `rendimento`, `unidade_rendimento`
- `custo_total`, `valor_venda`
- `cardapio` ('ativo'/'inativo')
- `modo_preparo`

### Tabelas Relacionadas

**`receitas_ingredientes`**
- `ingrediente_id`, `ingrediente` (nome snapshot)
- `qtde_embalagem`, `preco_embalagem`, `quantidade_utilizada`
- `custo_unitario`, `custo_receita`

**`receitas_embalagens`**
- Mesma estrutura de receitas_ingredientes

**`receitas_despesas_venda`**
- `despesa_id`, `nome`, `percentual`, `valor`

**`receitas_imagens`**
- `url`, `ordem`

**`receitas_mao_obra`**
- `perfil_id`, `horas`, `usar_valor_padrao`

### Rotas
- `/precificacao/ficha-tecnica` — Listagem
- `/precificacao/ficha-tecnica/nova` — Criar
- `/precificacao/ficha-tecnica/editar/:id` — Editar

### Hook de Cálculo
`useCalculosReceita` — Calcula custo total considerando ingredientes, embalagens, mão de obra e custos fixos rateados.

---

## 7. MÃO DE OBRA

**Tabela:** `mao_obra_perfis`
- `nome`, `valor_hora`, `padrao` (boolean), `ativo`

**Tabela:** `mao_obra_perfis_historico`
- `perfil_id`, `acao`, `valor_antigo`, `valor_novo`

**Configuração:** `/configuracoes/precificacao/mao-de-obra`

### Lançamento de Horas
O diálogo de adição de mão de obra usa campos separados de **horas** e **minutos** (não horas decimais). O valor é convertido internamente para horas decimais para cálculo de custo.

---

## 8. CATEGORIAS DE RECEITAS

**Tabela:** `categorias`
- `nome`, `ativo`, `padrao_sistema`
- Categorias padrão são criadas automaticamente via trigger ao criar usuário

**Configuração:** `/configuracoes/categorias-receitas`

---

## 9. UNIDADES DE MEDIDA

**Tabela:** `unidades_medida`
- `nome`, `sigla`, `codigo`
- `e_padrao` (boolean)

**Configuração:** `/configuracoes/unidades-medida`

---

## 10. RLS

Todas as tabelas: `auth.uid() = usuario_id`

Tabelas filhas (receitas_ingredientes, receitas_embalagens, etc.):
```sql
EXISTS (SELECT 1 FROM receitas WHERE id = receita_id AND usuario_id = auth.uid())
```
