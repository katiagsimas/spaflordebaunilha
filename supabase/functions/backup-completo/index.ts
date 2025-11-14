import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Não autenticado');
    }

    const tabelas = [
      'clientes',
      'cliente_familiares',
      'fornecedores',
      'fornecedor_contatos',
      'receitas',
      'receitas_ingredientes',
      'receitas_embalagens',
      'ingredientes',
      'embalagens',
      'pre_preparos',
      'pre_preparos_ingredientes',
      'sub_receitas',
      'sub_receitas_ingredientes',
      'tipos_insumos',
      'encomendas',
      'encomenda_itens',
      'tags_encomendas',
      'estoque_atual',
      'movimentacoes_estoque',
      'entradas_detalhadas',
      'contas_receber',
      'contas_receber_parcelas',
      'contas_receber_pagamentos',
      'contas_receber_comprovantes',
      'contas_pagar',
      'contas_pagar_parcelas',
      'contas_pagar_pagamentos',
      'contas_pagar_comprovantes',
      'categorias',
      'categorias_estoque',
      'unidades_medida',
      'bancos',
      'plano_contas',
      'categorias_plano_contas',
      'tipos_documento',
      'custos_fixos',
      'cmv_mensal',
      'mao_obra',
      'configuracoes_juros'
    ];

    const backup: any = {
      metadata: {
        version: "1.0",
        created_at: new Date().toISOString(),
        user_id: user.id,
        tables: []
      },
      data: {}
    };

    // Buscar dados de cada tabela
    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabaseClient
          .from(tabela)
          .select('*')
          .or(`usuario_id.eq.${user.id},user_id.eq.${user.id}`);

        if (!error && data && data.length > 0) {
          backup.data[tabela] = data;
          backup.metadata.tables.push({
            name: tabela,
            count: data.length
          });
        }
      } catch (err) {
        console.warn(`Erro ao processar ${tabela}:`, err);
      }
    }

    return new Response(
      JSON.stringify(backup),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
