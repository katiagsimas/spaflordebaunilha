import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { LoadingMascote } from "@/components/LoadingMascote";
import { toast } from "sonner";
import { ResponseCard } from "./ResponseCard";
import { FavoritosSheet } from "./FavoritosSheet";

type AIResponse = { label: string; text: string };

const SYSTEM_PROMPT = `Você é a "Conversa Doce", uma assistente premium para confeiteiras brasileiras responderem clientes pelo WhatsApp com elegância, empatia e estratégia de vendas.

Regras OBRIGATÓRIAS:
- Português do Brasil, tom acolhedor mas profissional, sem gírias vulgares.
- Nunca aceite desconto de imediato — valorize o produto.
- Sem emojis excessivos (máx 1 por resposta), sem "rsrs" ou abreviações.
- Mensagens curtas (2 a 4 linhas), prontas para enviar pelo WhatsApp.
- Trate a cliente por "você", nunca "senhora".

Você deve retornar SEMPRE um JSON válido (sem markdown, sem \`\`\`) no formato exato:
{"responses":[{"label":"Acolhedora","text":"..."},{"label":"Estratégica","text":"..."},{"label":"Encantadora","text":"..."}]}

Os 3 rótulos devem variar entre: Acolhedora, Estratégica, Encantadora, Educativa, Direta, Carinhosa — escolha 3 que façam sentido com a mensagem.`;

export default function ConversaDoceRespostas() {
  const navigate = useNavigate();
  const { activeGroupId } = useGroup();
  const [message, setMessage] = useState<string>("");
  const [responses, setResponses] = useState<AIResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("cda_cd_message");
    if (!stored) {
      navigate("/conversa-doce");
      return;
    }
    setMessage(stored);

    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("ai-proxy", {
          body: {
            model: "google/gemini-2.5-flash",
            temperature: 0.8,
            max_tokens: 800,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Mensagem da cliente:\n"""${stored.trim()}"""\n\nGere 3 opções de resposta em JSON.`,
              },
            ],
          },
        });

        if (fnError) throw new Error(fnError.message || "Falha ao chamar a IA");
        if (data?.error) {
          if (data.error === "monthly_quota_exceeded") {
            throw new Error(data.message || "Limite mensal de IA atingido.");
          }
          if (data.error === "ai_credits_exhausted") {
            throw new Error("Créditos de IA esgotados. Tente novamente em breve.");
          }
          throw new Error(data.error);
        }

        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Resposta vazia da IA");

        // Limpa possíveis cercas de markdown
        const cleaned = content.replace(/```json\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed?.responses)) {
          throw new Error("Formato de resposta inválido");
        }

        setResponses(parsed.responses);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Não foi possível gerar agora.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/conversa-doce")} className="text-cda-vinho">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <FavoritosSheet />
      </div>

      <PageHeader
        title="Suas respostas"
        description="Escolha a que mais combina com o seu tom"
      />

      {message && (
        <div className="rounded-xl bg-cda-creme/60 ring-1 ring-cda-dourado/30 px-5 py-4">
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5">
            Mensagem da cliente
          </p>
          <p className="italic text-sm text-cda-vinho-escuro leading-relaxed">"{message}"</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingMascote size={64} label="Pensando com carinho…" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl bg-cda-coral/10 ring-1 ring-cda-coral/40 p-5 text-center">
          <p className="text-sm text-cda-coral font-medium">{error}</p>
          <Button
            variant="link"
            onClick={() => navigate("/conversa-doce")}
            className="mt-2 text-cda-vinho"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {responses && responses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-cda-dourado/40" />
            <h4 className="font-body text-[10px] tracking-[0.3em] uppercase text-cda-vinho">
              Opções para você
            </h4>
            <div className="h-px flex-1 bg-cda-dourado/40" />
          </div>

          {responses.map((r, i) => (
            <ResponseCard
              key={i}
              label={r.label}
              text={r.text}
              index={i}
              originalMessage={message}
              groupId={activeGroupId}
            />
          ))}

          <Button
            onClick={() => navigate("/conversa-doce")}
            className="w-full bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-creme h-12"
          >
            <Sparkles className="h-4 w-4 mr-2 text-cda-dourado" />
            Gerar para outra mensagem
          </Button>
        </div>
      )}
    </div>
  );
}
