import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é o motor de Planejamento de Vendas do Donna's Box. 

OBJETIVO: Gerar um plano mensal claro, viável e mensurável, priorizando produtos Ativos.

PROCESSO:
1. Validar Metas
   - Recalcular ticket_medio_calculado = meta_faturamento / max(meta_pedidos, 1)
   - Se diferença > 5%, ajustar e registrar em ajustes_aplicados

2. Calcular margem unitária por produto
   - margem_unit = preco_venda − cmv_unitario − (preco_venda * taxa_media_pagamento_pct/100)

3. Definir pesos por produto
   - Peso histórico (normalizado) pela qtd_vendida
   - Peso margem (normalizado) por margem_unit (não negativar)
   - Peso final = 0,6 * histórico + 0,4 * margem
   - Se sem histórico: 0,5 popularidade (inverso do preço) + 0,5 margem

4. Distribuir meta de faturamento
   - Alocar meta_faturamento proporcional aos pesos finais

5. Derivar quantidades
   - qtd_planejada = round_down(faturamento_alocado / preco_venda), mínimo 1 nos top-5
   - Reconciliar sobra/falta até ±1% da meta

6. Projeção de lucro
   - lucro_unit = margem_unit
   - lucro_planejado = sum(qtd_planejada * lucro_unit)
   - Se < meta_lucro, realocar +5% dos piores 30% para melhores 30%

7. Checkpoint com Ponto de Equilíbrio
   - Garantir meta_faturamento >= ponto_de_equilibrio_mensal
   - Se não, marcar risco_quebra = true

8. Checklist: 3-5 ações táticas

REGRAS:
- Usar APENAS produtos com ativo = true
- Nunca recomendar produtos inativos
- Priorizar realocação nos Top-30% de melhor margem
- Fechar meta em ±1%

Retorne APENAS o JSON válido conforme especificação, sem texto adicional.`;

    const userPrompt = `Entrada:\n${JSON.stringify(input, null, 2)}\n\nRetorne o JSON de saída conforme especificação.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Tentar parsear o JSON da resposta
    let parsedResult;
    try {
      // Remover markdown code blocks se existirem
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid JSON in AI response");
    }

    return new Response(
      JSON.stringify({ result: parsedResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in planejamento-vendas:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
