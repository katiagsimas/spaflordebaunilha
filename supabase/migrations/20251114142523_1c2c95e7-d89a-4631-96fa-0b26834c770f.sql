-- Função para criar bancos padrão brasileiros para um usuário
CREATE OR REPLACE FUNCTION public.criar_bancos_padrao_para_usuario(p_usuario_id uuid)
RETURNS void AS $$
BEGIN
  -- Inserir bancos oficiais brasileiros apenas se não existirem para este usuário
  INSERT INTO public.bancos (usuario_id, codigo, nome, tipo, saldo_inicial, e_banco_oficial, e_customizado, habilitado)
  SELECT 
    p_usuario_id,
    codigo,
    nome,
    'Conta Corrente'::character varying,
    0,
    true,
    false,
    false
  FROM (VALUES
    ('001', 'Banco do Brasil'),
    ('004', 'Banco do Nordeste'),
    ('033', 'Santander'),
    ('041', 'Banrisul'),
    ('047', 'Banese'),
    ('069', 'Banco Crefisa'),
    ('077', 'Banco Inter'),
    ('104', 'Caixa Econômica Federal'),
    ('136', 'Unicred'),
    ('208', 'BTG Pactual'),
    ('212', 'Banco Original'),
    ('218', 'BS2'),
    ('237', 'Bradesco'),
    ('260', 'Nubank'),
    ('318', 'Banco BMG'),
    ('323', 'Mercado Pago'),
    ('336', 'Banco C6'),
    ('341', 'Itaú Unibanco'),
    ('380', 'PicPay'),
    ('422', 'Banco Safra'),
    ('623', 'Banco Pan'),
    ('643', 'Banco Pine'),
    ('655', 'Banco Votorantim'),
    ('707', 'Banco Daycoval'),
    ('735', 'Banco Neon'),
    ('748', 'Sicredi'),
    ('756', 'Bancoob')
  ) AS bancos_oficiais(codigo, nome)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.bancos 
    WHERE usuario_id = p_usuario_id 
    AND codigo = bancos_oficiais.codigo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar bancos padrão para todos os usuários existentes
DO $$
DECLARE
  usuario_record RECORD;
BEGIN
  FOR usuario_record IN 
    SELECT DISTINCT usuario_id FROM public.bancos
    UNION
    SELECT DISTINCT auth.uid() WHERE auth.uid() IS NOT NULL
  LOOP
    PERFORM criar_bancos_padrao_para_usuario(usuario_record.usuario_id);
  END LOOP;
END $$;

-- Atualizar todos os bancos existentes para desabilitados
UPDATE public.bancos SET habilitado = false WHERE habilitado IS NULL OR habilitado = true;