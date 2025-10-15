-- Adicionar campos de configuração de trabalho na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dias_trabalho_mes INTEGER DEFAULT 22,
ADD COLUMN IF NOT EXISTS horas_diaria_trabalho INTEGER DEFAULT 8;

-- Comentários para documentação
COMMENT ON COLUMN profiles.dias_trabalho_mes IS 'Número de dias trabalhados por mês para cálculo de custo fixo por hora';
COMMENT ON COLUMN profiles.horas_diaria_trabalho IS 'Número de horas trabalhadas por dia para cálculo de custo fixo por hora';