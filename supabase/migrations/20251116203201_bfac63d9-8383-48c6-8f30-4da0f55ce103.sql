-- Remove a tag "Mesversário" do banco de dados
DELETE FROM tags_encomendas
WHERE nome = 'Mesversário' 
  AND cor = '#EC4899' 
  AND descricao = 'Celebração Mensal de Bebês';