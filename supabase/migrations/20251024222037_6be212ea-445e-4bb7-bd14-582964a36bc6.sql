-- Habilitar realtime para as tabelas financeiras e encomendas
ALTER TABLE contas_receber_parcelas REPLICA IDENTITY FULL;
ALTER TABLE contas_receber_pagamentos REPLICA IDENTITY FULL;
ALTER TABLE contas_pagar_parcelas REPLICA IDENTITY FULL;
ALTER TABLE contas_pagar_pagamentos REPLICA IDENTITY FULL;
ALTER TABLE encomendas REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE contas_receber_parcelas;
ALTER PUBLICATION supabase_realtime ADD TABLE contas_receber_pagamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE contas_pagar_parcelas;
ALTER PUBLICATION supabase_realtime ADD TABLE contas_pagar_pagamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE encomendas;