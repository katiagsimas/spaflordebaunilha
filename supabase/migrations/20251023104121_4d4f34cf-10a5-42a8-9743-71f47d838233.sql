-- Adicionar campo para logomarca personalizada no perfil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;