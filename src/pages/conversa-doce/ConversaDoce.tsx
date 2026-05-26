import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Wand2, Send, Sparkles, ShieldCheck, Lock, Clock, Star, Smile, Cake } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoritosSheet } from "./FavoritosSheet";

const MAX = 1500;
const EXAMPLES = [
  "Tá caro",
  "Vou pensar",
  "Consegue desconto?",
  "Quero orçamento",
  "A concorrência faz mais barato",
];

const BENEFITS = [
  { icon: Clock, title: "Responda mais rápido", desc: "com segurança e elegância" },
  { icon: Star, title: "Transmita profissionalismo", desc: "e valor agregado" },
  { icon: Smile, title: "Aumente suas vendas", desc: "e fidelize clientes" },
  { icon: Cake, title: "Ganhe tempo", desc: "para o que importa: seus doces" },
];

const STEPS = [
  { Icon: MessageCircle, t: "1. Cole a mensagem", d: "que sua cliente enviou" },
  { Icon: Wand2, t: "2. A IA cria opções", d: "de resposta para você" },
  { Icon: Send, t: "3. Escolha e envie", d: "pelo WhatsApp" },
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
    <div className="space-y-6">
      <PageHeader
        title="Conversa Doce"
        description="Sua assistente premium de respostas no WhatsApp"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1 — Como funciona */}
        <Card className="overflow-hidden border-cda-dourado/30 shadow-sm">
          <div className="bg-cda-vinho text-cda-creme px-6 py-8 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.1] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, hsl(var(--cda-dourado)) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative">
              <Sparkles className="h-8 w-8 mx-auto text-cda-dourado mb-2" />
              <h2 className="font-display text-2xl text-cda-dourado">Conversa Doce</h2>
              <p className="font-body italic text-sm text-cda-creme/85 mt-1">
                Respostas elegantes e estratégicas para confeiteiras
              </p>
            </div>
          </div>

          <CardContent className="pt-6">
            <h3 className="font-display text-lg text-cda-vinho text-center">Como funciona?</h3>
            <p className="text-xs text-muted-foreground text-center italic mb-5">
              3 passos simples para respostas incríveis
            </p>

            <div className="grid grid-cols-3 gap-3">
              {STEPS.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-cda-creme ring-1 ring-cda-dourado/40 flex items-center justify-center text-cda-vinho">
                    <s.Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-cda-vinho-escuro leading-tight">{s.t}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{s.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-cda-creme/50 ring-1 ring-cda-dourado/30">
              <ShieldCheck className="h-5 w-5 text-cda-vinho shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-xs font-semibold text-cda-vinho-escuro">Seus dados estão seguros</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  As mensagens não são armazenadas e a IA não é treinada com seus dados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Formulário */}
        <Card className="overflow-hidden border-cda-dourado/30 shadow-sm flex flex-col">
          <div className="bg-cda-vinho text-cda-creme px-6 py-6 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.1] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, hsl(var(--cda-dourado)) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-display text-lg text-cda-dourado">O que sua cliente falou?</h3>
                <p className="text-xs italic text-cda-creme/80 mt-0.5">
                  Cole a mensagem dela. Cuidamos do resto.
                </p>
              </div>
              <FavoritosSheet />
            </div>
          </div>

          <CardContent className="pt-6 flex-1 flex flex-col">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                placeholder="Ex: Adorei seu trabalho, mas tá um pouco fora do meu orçamento…"
                rows={5}
                className="w-full resize-none rounded-xl bg-cda-branco border border-cda-dourado/40 focus:border-cda-dourado focus:ring-2 focus:ring-cda-dourado/30 outline-none px-4 py-3 pb-8 text-sm leading-relaxed text-cda-preto placeholder:text-muted-foreground placeholder:italic transition"
              />
              <span className="absolute bottom-2.5 right-4 text-[11px] text-muted-foreground/70 font-medium">
                {message.length}/{MAX}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setMessage(ex)}
                  className="text-xs px-3 py-1.5 rounded-full bg-cda-creme text-cda-vinho hover:bg-cda-dourado hover:text-cda-vinho-escuro transition-all font-medium ring-1 ring-cda-dourado/30"
                >
                  {ex}
                </button>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!message.trim()}
              className="mt-4 w-full bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-creme h-12 text-base"
            >
              <Sparkles className="h-4 w-4 mr-2 text-cda-dourado" />
              Gerar Respostas
            </Button>

            <div className="mt-3 flex items-start gap-2 text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cda-dourado" />
              <p className="italic text-[11px] leading-relaxed">
                Suas mensagens não são armazenadas e a IA não é treinada com seus dados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefícios */}
      <Card className="border-cda-dourado/30">
        <CardContent className="pt-6">
          <h3 className="font-display text-lg text-cda-vinho text-center mb-4">Por que usar?</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-cda-creme ring-1 ring-cda-dourado/40 flex items-center justify-center shrink-0">
                  <b.icon className="h-5 w-5 text-cda-vinho" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cda-vinho-escuro">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
