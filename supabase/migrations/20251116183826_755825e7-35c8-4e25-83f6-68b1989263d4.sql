-- Adicionar novos valores ao enum tipo_movimentacao
ALTER TYPE tipo_movimentacao ADD VALUE IF NOT EXISTS 'PERDA';
ALTER TYPE tipo_movimentacao ADD VALUE IF NOT EXISTS 'AJUSTE';