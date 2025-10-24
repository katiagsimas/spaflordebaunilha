-- Deletar view existente e recriar
DROP VIEW IF EXISTS vw_resumo_financeiro;

-- Criar função para garantir banco Caixa Empresa padrão
CREATE OR REPLACE FUNCTION criar_banco_caixa_empresa_padrao(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO bancos (usuario_id, codigo, nome, tipo, saldo_inicial, e_banco_oficial)
  VALUES (p_user_id, '000', 'Caixa Empresa', 'Caixa', 0, true)
  ON CONFLICT (usuario_id, codigo) DO NOTHING;
END;
$$;

-- Trigger para criar banco padrão para novos usuários
CREATE OR REPLACE FUNCTION trigger_criar_banco_caixa_novo_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM criar_banco_caixa_empresa_padrao(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_banco_caixa ON auth.users;
CREATE TRIGGER on_auth_user_created_banco_caixa
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_criar_banco_caixa_novo_usuario();

-- Criar view de resumo financeiro por banco
CREATE VIEW vw_resumo_financeiro AS
WITH saldos_iniciais AS (
  SELECT 
    b.usuario_id,
    b.id as banco_id,
    b.codigo as banco_codigo,
    b.nome as banco_nome,
    COALESCE(sib.saldo_inicial, 0) as saldo_inicial,
    COALESCE(sib.mes_referencia, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER) as mes,
    COALESCE(sib.ano_referencia, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) as ano
  FROM bancos b
  LEFT JOIN saldos_iniciais_bancos sib ON sib.banco_id = b.id 
    AND sib.mes_referencia = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
    AND sib.ano_referencia = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
),
entradas_mes AS (
  SELECT 
    si.usuario_id,
    si.banco_id,
    si.mes,
    si.ano,
    COALESCE(SUM(
      CASE 
        WHEN pag.estornado = false OR pag.estornado IS NULL 
        THEN pag.valor_pago + COALESCE(pag.juros, 0) - COALESCE(pag.desconto, 0)
        ELSE 0 
      END
    ), 0) as total_entradas
  FROM saldos_iniciais si
  LEFT JOIN contas_receber_pagamentos pag ON pag.banco_id = si.banco_id
    AND EXTRACT(MONTH FROM pag.data_pagamento) = si.mes
    AND EXTRACT(YEAR FROM pag.data_pagamento) = si.ano
  GROUP BY si.usuario_id, si.banco_id, si.mes, si.ano
),
saidas_mes AS (
  SELECT 
    si.usuario_id,
    si.banco_id,
    si.mes,
    si.ano,
    COALESCE(SUM(
      CASE 
        WHEN pag.estornado = false OR pag.estornado IS NULL 
        THEN pag.valor_pago + COALESCE(pag.juros, 0) - COALESCE(pag.desconto, 0)
        ELSE 0 
      END
    ), 0) as total_saidas
  FROM saldos_iniciais si
  LEFT JOIN contas_pagar_pagamentos pag ON pag.banco_id = si.banco_id
    AND EXTRACT(MONTH FROM pag.data_pagamento) = si.mes
    AND EXTRACT(YEAR FROM pag.data_pagamento) = si.ano
  GROUP BY si.usuario_id, si.banco_id, si.mes, si.ano
)
SELECT 
  si.usuario_id as user_id,
  si.banco_id,
  si.banco_codigo,
  si.banco_nome,
  si.mes,
  si.ano,
  si.saldo_inicial,
  COALESCE(e.total_entradas, 0) as entradas_mes,
  COALESCE(s.total_saidas, 0) as saidas_mes,
  si.saldo_inicial + COALESCE(e.total_entradas, 0) - COALESCE(s.total_saidas, 0) as saldo_atual
FROM saldos_iniciais si
LEFT JOIN entradas_mes e ON e.banco_id = si.banco_id AND e.mes = si.mes AND e.ano = si.ano
LEFT JOIN saidas_mes s ON s.banco_id = si.banco_id AND s.mes = si.mes AND s.ano = si.ano;