import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Wand2, Send, Sparkles, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoritosSheet } from "./FavoritosSheet";
import heroImage from "@/assets/conversa-doce-hero.jpg";

const MAX = 1500;
const EXAMPLES = [
  "Tá caro",
  "Vou pensar",
  "Consegue desconto?",
  "Quero orçamento",
  "A concorrência faz mais barato",
];

const STEPS = [
  { Icon: MessageCircle, t: "1. Cole a mensagem", d: "que sua cliente enviou." },
  { Icon: Wand2, t: "2. A IA cria opções", d: "de resposta para você." },
  { Icon: Send, t: "3. Escolha, personalize", d: "e envie pelo WhatsApp!" },
];

// Speech bubbles flutuantes ao redor da ilustração
const BUBBLES: { text: string; pos: string; tail: string }[] = [
  {
    text: "Mais tempo para criar. Menos tempo para explicar.",
    pos: "top-6 -left-2 sm:left-2",
    tail: "after:right-[-6px] after:top-1/2 after:-translate-y-1/2 after:border-l-cda-pink",
  },
  {
    text: "Respostas profissionais para clientes exigentes.",
    pos: "top-6 -right-2 sm:right-2",
    tail: "after:left-[-6px] after:top-1/2 after:-translate-y-1/2 after:border-r-cda-pink",
  },
  {
    text: "Clientes felizes voltam, indicam e compram mais.",
    pos: "bottom-6 -left-2 sm:left-2",
    tail: "after:right-[-6px] after:top-1/2 after:-translate-y-1/2 after:border-l-cda-pink",
  },
  {
    text: "Você foca no que faz de melhor: encantar com seus doces!",
    pos: "bottom-6 -right-2 sm:right-2",
    tail: "after:left-[-6px] after:top-1/2 after:-translate-y-1/2 after:border-r-cda-pink",
  },
];

export default function ConversaDoce() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleGenerate = () => {
    if (!message.trim()) return;
    sessionStorage.setItem("cda_cd_message", message.trim());
    navigate("/conversa-doce/respostas");
  };

  return (
    <div className="relative space-y-6 pb-12">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ============ CARD 1 — Hero + Como funciona ============ */}
        <Card className="overflow-hidden border-cda-dourado/30 shadow-md rounded-3xl">
          {/* Hero vinho com ilustração e bubbles */}
          <div className="relative bg-gradient-to-b from-cda-vinho-escuro to-cda-vinho text-cda-creme px-6 pt-8 pb-10 overflow-hidden">
            {/* textura pontilhada */}
            <div
              className="absolute inset-0 opacity-[0.12] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, hsl(var(--cda-dourado)) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            {/* sparkle topo */}
            <div className="relative flex justify-center">
              <Sparkles className="h-6 w-6 text-cda-dourado" />
            </div>
            <h2 className="relative font-display text-4xl text-cda-dourado text-center mt-2 tracking-wide">
              Conversa Doce
            </h2>
            <p className="relative font-body italic text-sm text-cda-creme/85 text-center mt-1">
              Seu assistente de respostas premium no WhatsApp
            </p>

            {/* Ilustração circular + bubbles */}
            <div className="relative mt-6 mx-auto max-w-md aspect-square">
              {/* moldura dourada com glow */}
              <div className="absolute inset-[18%] rounded-full ring-4 ring-cda-dourado/60 shadow-[0_0_40px_rgba(201,161,74,0.35)] overflow-hidden bg-cda-vinho-escuro">
                <img
                  src={heroImage}
                  alt="Confeiteira com celular"
                  width={1024}
                  height={1024}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bubbles */}
              {BUBBLES.map((b, i) => (
                <div
                  key={i}
                  className={`absolute ${b.pos} w-[40%] sm:w-[36%] z-10`}
                >
                  <div
                    className={`relative bg-cda-pink text-cda-vinho-escuro text-[11px] leading-snug font-medium px-3 py-2 rounded-2xl shadow-md text-center
                      after:content-[''] after:absolute after:w-0 after:h-0
                      after:border-y-[6px] after:border-y-transparent
                      after:border-l-[8px] after:border-r-[8px] after:border-l-transparent after:border-r-transparent
                      ${b.tail}`}
                  >
                    {b.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Como funciona */}
          <CardContent className="pt-8 pb-6 bg-cda-creme/40">
            <h3 className="font-display text-2xl text-cda-vinho text-center">Como funciona?</h3>
            <p className="text-xs text-muted-foreground text-center italic mb-6">
              3 passos simples para respostas incríveis
            </p>

            <div className="grid grid-cols-3 gap-3 relative">
              {/* linhas tracejadas conectoras */}
              <div className="hidden sm:block absolute top-6 left-[16%] right-[16%] border-t border-dashed border-cda-dourado/40 pointer-events-none" />
              {STEPS.map((s, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-cda-creme ring-1 ring-cda-dourado/50 flex items-center justify-center text-cda-vinho z-10">
                    <s.Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-cda-vinho-escuro leading-tight">
                    {s.t}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug italic">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-cda-branco ring-1 ring-cda-dourado/30">
              <ShieldCheck className="h-5 w-5 text-cda-vinho shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-cda-vinho-escuro">Seus dados estão seguros</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Suas mensagens não são armazenadas e não treinamos IA com seus dados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ CARD 2 — Formulário ============ */}
        <Card className="overflow-hidden border-cda-dourado/30 shadow-md rounded-3xl flex flex-col">
          {/* Hero menor vinho com mesmo título */}
          <div className="relative bg-gradient-to-b from-cda-vinho-escuro to-cda-vinho text-cda-creme px-6 pt-8 pb-6 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.12] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, hsl(var(--cda-dourado)) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative flex justify-between items-start gap-3">
              <div className="flex-1 text-center">
                <div className="flex justify-center">
                  <Sparkles className="h-6 w-6 text-cda-dourado" />
                </div>
                <h2 className="font-display text-4xl text-cda-dourado mt-2 tracking-wide">
                  Conversa Doce
                </h2>
                <p className="font-body italic text-sm text-cda-creme/85 mt-1">
                  Seu assistente de respostas premium no WhatsApp
                </p>
              </div>
              <div className="absolute top-0 right-0">
                <FavoritosSheet />
              </div>
            </div>
          </div>

          {/* Formulário */}
          <CardContent className="pt-6 pb-6 flex-1 flex flex-col bg-cda-creme/40">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cda-creme ring-1 ring-cda-dourado/50 flex items-center justify-center text-cda-vinho shrink-0">
                <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-display text-xl text-cda-vinho-escuro leading-tight">
                  O que sua cliente falou?
                </h3>
                <p className="text-xs italic text-muted-foreground mt-0.5">
                  Cole a mensagem dela. Vamos cuidar do resto com elegância.
                </p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                placeholder="Ex: Adorei seu trabalho, mas tá um pouco fora do meu orçamento…"
                rows={6}
                className="w-full resize-none rounded-2xl bg-cda-branco border border-cda-dourado/40 focus:border-cda-dourado focus:ring-2 focus:ring-cda-dourado/30 outline-none px-4 py-3 pb-8 text-sm leading-relaxed text-cda-preto placeholder:text-muted-foreground placeholder:italic transition"
              />
              <span className="absolute bottom-2.5 right-4 text-[11px] text-muted-foreground/70 font-medium">
                {message.length} / {MAX}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setMessage(ex)}
                  className="text-xs px-4 py-2 rounded-full bg-cda-pink/60 text-cda-vinho-escuro hover:bg-cda-dourado hover:text-cda-vinho-escuro transition-all font-medium ring-1 ring-cda-dourado/30"
                >
                  {ex}
                </button>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!message.trim()}
              className="mt-5 w-full bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-creme h-14 text-base rounded-2xl shadow-md"
            >
              <Sparkles className="h-5 w-5 mr-2 text-cda-dourado" />
              Gerar Respostas
            </Button>

            <div className="mt-4 flex items-start gap-2 text-muted-foreground justify-center">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cda-dourado" />
              <p className="italic text-[11px] leading-relaxed text-center">
                Suas mensagens não são armazenadas e não treinamos IA com seus dados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selo flutuante "Feito para confeiteiras" */}
      <div className="hidden md:flex absolute -bottom-4 right-4 z-20 pointer-events-none">
        <div className="relative w-28 h-28 rounded-full bg-cda-vinho text-cda-creme flex items-center justify-center text-center shadow-xl ring-4 ring-cda-dourado/60">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, hsl(var(--cda-dourado) / 0.4), transparent 25%, hsl(var(--cda-dourado) / 0.4) 50%, transparent 75%, hsl(var(--cda-dourado) / 0.4))",
              mask: "radial-gradient(circle, transparent 60%, black 62%)",
              WebkitMask: "radial-gradient(circle, transparent 60%, black 62%)",
            }}
          />
          <div className="relative px-3">
            <Sparkles className="h-4 w-4 mx-auto text-cda-dourado mb-1" />
            <p className="font-display italic text-[10px] leading-tight text-cda-creme">
              Feito para confeiteiras que merecem mais tempo e leveza.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
