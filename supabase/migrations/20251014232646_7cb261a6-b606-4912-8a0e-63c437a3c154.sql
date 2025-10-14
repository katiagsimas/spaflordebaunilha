-- Adicionar colunas para informações do topo de bolo na tabela encomendas
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS topo_tema TEXT,
ADD COLUMN IF NOT EXISTS topo_aniversariante TEXT,
ADD COLUMN IF NOT EXISTS topo_idade TEXT,
ADD COLUMN IF NOT EXISTS topo_obs TEXT,
ADD COLUMN IF NOT EXISTS topo_imagem_url TEXT;

-- Criar bucket para imagens de topo de bolo se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('topo-bolo', 'topo-bolo', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket topo-bolo
CREATE POLICY "Usuários podem visualizar imagens de topo de bolo"
ON storage.objects FOR SELECT
USING (bucket_id = 'topo-bolo');

CREATE POLICY "Usuários podem fazer upload de imagens de topo de bolo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'topo-bolo' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar suas próprias imagens de topo de bolo"
ON storage.objects FOR DELETE
USING (bucket_id = 'topo-bolo' AND auth.uid() IS NOT NULL);