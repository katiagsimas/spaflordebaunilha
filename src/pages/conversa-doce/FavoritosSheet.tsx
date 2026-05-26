import { useState } from "react";
import { Heart, Copy, Trash2, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/contexts/GroupContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Favorito {
  id: string;
  texto: string;
  rotulo: string | null;
  mensagem_original: string | null;
  created_at: string;
  user_id: string;
}

export function FavoritosSheet() {
  const [open, setOpen] = useState(false);
  const { activeGroupId } = useGroup();
  const qc = useQueryClient();

  const { data: favoritos = [], isLoading } = useQuery({
    queryKey: ["conversa-doce-favoritos", activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return [];
      const { data, error } = await supabase
        .from("conversa_doce_favoritos")
        .select("*")
        .eq("owner_group_id", activeGroupId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Favorito[];
    },
    enabled: open && !!activeGroupId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("conversa_doce_favoritos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Favorito removido");
      qc.invalidateQueries({ queryKey: ["conversa-doce-favoritos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao remover"),
  });

  const handleCopy = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-cda-creme/20 border-cda-dourado/40 text-cda-creme hover:bg-cda-creme/30 hover:text-cda-dourado"
        >
          <Heart className="h-4 w-4 mr-1.5" />
          Favoritos
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-cda-vinho font-display">
            <Heart className="h-5 w-5 text-cda-coral" />
            Favoritos do grupo
          </SheetTitle>
          <SheetDescription>
            Respostas salvas pelos membros da sua confeitaria.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando…</p>
          )}

          {!isLoading && favoritos.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum favorito ainda. Salve respostas que funcionam bem para reutilizar depois.
              </p>
            </div>
          )}

          <div className="space-y-3 pb-6">
            {favoritos.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-cda-dourado/30 bg-cda-creme/30 p-3 space-y-2"
              >
                {f.rotulo && (
                  <Badge className="bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro">
                    {f.rotulo}
                  </Badge>
                )}
                <p className="text-sm text-cda-preto whitespace-pre-line leading-relaxed">
                  {f.texto}
                </p>
                {f.mensagem_original && (
                  <p className="text-[11px] italic text-muted-foreground border-l-2 border-cda-dourado/40 pl-2">
                    Em resposta a: "{f.mensagem_original.slice(0, 80)}
                    {f.mensagem_original.length > 80 ? "…" : ""}"
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(f.texto)}
                    className="h-7 text-xs border-cda-dourado/40 text-cda-vinho"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(f.id)}
                    disabled={deleteMutation.isPending}
                    className="h-7 text-xs text-cda-coral hover:text-cda-coral hover:bg-cda-coral/10 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
