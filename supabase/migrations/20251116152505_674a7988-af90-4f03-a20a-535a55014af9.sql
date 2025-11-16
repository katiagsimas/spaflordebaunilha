-- Remover o trigger antigo que usa o nome de campo errado
DROP TRIGGER IF EXISTS update_itens_updated_at ON itens;

-- Criar função específica para atualizar o campo atualizado_em da tabela itens
CREATE OR REPLACE FUNCTION update_itens_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar novo trigger usando o nome de campo correto
CREATE TRIGGER update_itens_atualizado_em
    BEFORE UPDATE ON itens
    FOR EACH ROW
    EXECUTE FUNCTION update_itens_atualizado_em();