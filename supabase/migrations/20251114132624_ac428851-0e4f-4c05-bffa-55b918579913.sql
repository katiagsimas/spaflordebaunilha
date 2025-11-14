-- Adiciona coluna habilitado na tabela bancos
ALTER TABLE bancos ADD COLUMN IF NOT EXISTS habilitado boolean DEFAULT false;

-- Cria função para inserir bancos oficiais para um usuário
CREATE OR REPLACE FUNCTION criar_bancos_oficiais_usuario(p_usuario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir apenas se o usuário ainda não tem nenhum banco oficial
  IF NOT EXISTS (
    SELECT 1 FROM bancos 
    WHERE usuario_id = p_usuario_id 
    AND e_banco_oficial = true
    LIMIT 1
  ) THEN
    INSERT INTO bancos (usuario_id, codigo, nome, tipo, e_banco_oficial, habilitado, saldo_inicial) VALUES
      (p_usuario_id, '000', 'Caixa Empresa', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '001', 'Banco do Brasil', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '004', 'Banco do Nordeste', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '033', 'Santander', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '041', 'Banrisul', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '047', 'Banese', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '069', 'Banco Crefisa', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '077', 'Banco Inter', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '104', 'Caixa Econômica Federal', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '136', 'Unicred', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '208', 'BTG Pactual', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '212', 'Banco Original', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '218', 'BS2', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '237', 'Bradesco', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '260', 'Nubank', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '318', 'Banco BMG', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '323', 'Mercado Pago', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '336', 'Banco C6', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '341', 'Itaú Unibanco', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '380', 'PicPay', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '422', 'Banco Safra', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '623', 'Banco Pan', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '643', 'Banco Pine', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '655', 'Banco Votorantim', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '707', 'Banco Daycoval', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '735', 'Banco Neon', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '748', 'Sicredi', 'Conta Corrente', true, false, 0),
      (p_usuario_id, '756', 'Bancoob/Sicoob', 'Conta Corrente', true, false, 0);
  END IF;
END;
$$;

-- Cria trigger para inserir bancos oficiais automaticamente para novos usuários
CREATE OR REPLACE FUNCTION trigger_criar_bancos_oficiais()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM criar_bancos_oficiais_usuario(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_bancos ON auth.users;
CREATE TRIGGER on_auth_user_created_bancos
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_criar_bancos_oficiais();

-- Inserir bancos oficiais para todos os usuários existentes
DO $$
DECLARE
  usuario_record RECORD;
BEGIN
  FOR usuario_record IN SELECT id FROM auth.users LOOP
    PERFORM criar_bancos_oficiais_usuario(usuario_record.id);
  END LOOP;
END;
$$;