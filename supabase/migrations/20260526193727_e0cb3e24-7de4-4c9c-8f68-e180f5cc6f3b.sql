
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS documento_tipo text,
  ADD COLUMN IF NOT EXISTS inscricao_municipal text,
  ADD COLUMN IF NOT EXISTS certificacoes text,
  ADD COLUMN IF NOT EXISTS email_comercial text,
  ADD COLUMN IF NOT EXISTS telefone_fixo text;

INSERT INTO public.contratos_templates (nome, tipo, descricao, icone, campos, corpo, ativo, ordem)
VALUES
  (
    'Contrato de Bolo de Aniversário',
    'aniversario',
    'Modelo padrão para encomenda de bolo de aniversário.',
    'Cake',
    '[
      {"key":"data_evento","label":"Data do Evento","tipo":"date","required":true,"section":"Evento"},
      {"key":"local_entrega","label":"Local de Entrega","tipo":"text","required":true,"section":"Evento"},
      {"key":"sabor_bolo","label":"Sabor do Bolo","tipo":"text","required":true,"section":"Produto"},
      {"key":"peso_kg","label":"Peso (kg)","tipo":"number","section":"Produto"},
      {"key":"valor_total","label":"Valor Total (R$)","tipo":"currency","required":true,"section":"Pagamento"},
      {"key":"forma_pagamento","label":"Forma de Pagamento","tipo":"text","required":true,"section":"Pagamento"}
    ]'::jsonb,
    'Pelo presente instrumento particular, {{empresa_nome}} (CNPJ/CPF {{empresa_documento}}) compromete-se a entregar para {{cliente_nome}} (CPF {{cliente_documento}}), no dia {{data_evento}}, no endereço {{local_entrega}}, 1 (um) bolo de aniversário sabor {{sabor_bolo}}, com peso aproximado de {{peso_kg}} kg, pelo valor total de R$ {{valor_total}}, a ser pago via {{forma_pagamento}}.',
    true,
    1
  ),
  (
    'Contrato de Bolo de Casamento',
    'casamento',
    'Modelo padrão para encomenda de bolo de casamento.',
    'Heart',
    '[
      {"key":"data_evento","label":"Data do Casamento","tipo":"date","required":true,"section":"Evento"},
      {"key":"local_evento","label":"Local do Evento","tipo":"text","required":true,"section":"Evento"},
      {"key":"andares","label":"Quantidade de Andares","tipo":"number","required":true,"section":"Produto"},
      {"key":"sabor_bolo","label":"Sabores","tipo":"textarea","required":true,"section":"Produto"},
      {"key":"valor_total","label":"Valor Total (R$)","tipo":"currency","required":true,"section":"Pagamento"},
      {"key":"sinal","label":"Sinal (R$)","tipo":"currency","section":"Pagamento"},
      {"key":"forma_pagamento","label":"Forma de Pagamento","tipo":"text","required":true,"section":"Pagamento"}
    ]'::jsonb,
    'Pelo presente, {{empresa_nome}} compromete-se a entregar para {{cliente_nome}}, no dia {{data_evento}}, no local {{local_evento}}, 1 (um) bolo de casamento com {{andares}} andares, sabores {{sabor_bolo}}, pelo valor total de R$ {{valor_total}}, sendo R$ {{sinal}} pagos como sinal e o restante via {{forma_pagamento}}.',
    true,
    2
  ),
  (
    'Contrato de Mesa de Doces',
    'mesa_doces',
    'Modelo padrão para encomenda de mesa de doces para eventos.',
    'Cookie',
    '[
      {"key":"data_evento","label":"Data do Evento","tipo":"date","required":true,"section":"Evento"},
      {"key":"local_evento","label":"Local","tipo":"text","required":true,"section":"Evento"},
      {"key":"convidados","label":"Número de Convidados","tipo":"number","required":true,"section":"Produto"},
      {"key":"doces_descricao","label":"Descrição dos Doces","tipo":"textarea","required":true,"section":"Produto"},
      {"key":"valor_total","label":"Valor Total (R$)","tipo":"currency","required":true,"section":"Pagamento"},
      {"key":"forma_pagamento","label":"Forma de Pagamento","tipo":"text","required":true,"section":"Pagamento"}
    ]'::jsonb,
    'Pelo presente, {{empresa_nome}} compromete-se a fornecer mesa de doces para o evento de {{cliente_nome}}, no dia {{data_evento}}, em {{local_evento}}, para {{convidados}} convidados, conforme descrição: {{doces_descricao}}. Valor total R$ {{valor_total}}, forma de pagamento {{forma_pagamento}}.',
    true,
    3
  );
