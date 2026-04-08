import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  imagePath: string;
  index: number;
  onRemove: (path: string) => void;
}

export function EncomendaImagePreview({ imagePath, index, onRemove }: Props) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (imagePath.startsWith("http")) {
      setImageUrl(imagePath);
    } else {
      supabase.storage
        .from("encomendas")
        .createSignedUrl(imagePath, 3600)
        .then(({ data, error }) => {
          if (data?.signedUrl) {
            setImageUrl(data.signedUrl);
          } else {
            console.error("[EncomendaImagePreview] Erro ao gerar URL:", error?.message);
          }
        });
    }
  }, [imagePath]);

  if (!imageUrl) return null;

  return (
    <div className="relative group">
      <img
        src={imageUrl}
        alt={`Referência ${index + 1}`}
        className="w-full h-24 object-cover rounded-lg border-2 border-pink-200 dark:border-pink-700"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(imagePath)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
