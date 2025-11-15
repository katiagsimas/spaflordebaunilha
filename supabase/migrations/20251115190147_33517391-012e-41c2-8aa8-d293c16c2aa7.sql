-- Adicionar campo tipo na tabela custos_fixos
ALTER TABLE custos_fixos 
ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'fixo';

-- Adicionar constraint para validar os valores aceitos
ALTER TABLE custos_fixos
ADD CONSTRAINT custos_fixos_tipo_check 
CHECK (tipo IN ('fixo', 'mao_obra_indireta', 'outros'));

-- Criar índice para melhorar performance nas consultas por tipo
CREATE INDEX IF NOT EXISTS idx_custos_fixos_tipo ON custos_fixos(tipo);

-- Comentários para documentação
COMMENT ON COLUMN custos_fixos.tipo IS 'Tipo do custo fixo: fixo (padrão), mao_obra_indireta (salários, encargos), outros';
