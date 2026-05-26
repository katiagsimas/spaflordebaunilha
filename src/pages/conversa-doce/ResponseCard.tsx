import { useState } from "react";
import { Copy, Check, Heart, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  label: string;
  text: string;
  index: number;
  originalMessage: string;
  groupId: string | null;
}

export function ResponseCard({ label, text, index, originalMessage, groupId }: Props) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [draft, setDraft] = useState(text);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      toast.success("Resposta copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleFavorite = async () => {
    if (!groupId) {
      toast.error("Selecione um grupo ativo primeiro.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("conversa_doce_favoritos").insert({
        owner_group_id: groupId,
        user_id: user.id,
        texto: currentText,
        rotulo: label,
        mensagem_original: originalMessage,
      });

      if (error) throw error;
      setSaved(true);
      toast.success("Salvo nos favoritos do grupo!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = () => {
    setCurrentText(draft);
    setEditing(false);
    toast.success("Resposta atualizada");
  };

  const accentColors = ["bg-cda-pink/20", "bg-cda-dourado/20", "bg-cda-coral/20"];
  const accent = accentColors[index % accentColors.length];

  return (
    <Card className="border-cda-dourado/30 overflow-hidden">
      <div className={`px-5 py-2 ${accent} border-b border-cda-dourado/20`}>
        <Badge className="bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro">
          {label}
        </Badge>
      </div>
      <CardContent className="pt-4">
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="border-cda-dourado/40 focus-visible:ring-cda-dourado/30"
          />
        ) : (
          <p className="text-sm leading-relaxed text-cda-preto whitespace-pre-line">
            {currentText}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit} className="bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-creme">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(currentText);
                  setEditing(false);
                }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={handleCopy}
                className="bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-creme"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                className="border-cda-dourado/40 text-cda-vinho hover:bg-cda-creme"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFavorite}
                disabled={saving || saved}
                className="border-cda-dourado/40 text-cda-vinho hover:bg-cda-creme ml-auto"
              >
                <Heart className={`h-3.5 w-3.5 mr-1.5 ${saved ? "fill-cda-coral text-cda-coral" : ""}`} />
                {saved ? "Salvo" : "Favoritar"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
