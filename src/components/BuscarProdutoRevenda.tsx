import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { importarProdutoRevendaComoInsumo, type InsumoImportado } from "@/lib/produtoRevenda";

interface BuscarProdutoRevendaProps {
  onImportado: (insumo: InsumoImportado) => void;
  label?: string;
  hint?: string;
}

/**
 * Campo de busca por código de produto Natura/Avon.
 * Ao localizar, converte o produto em insumo (persistido no banco) e devolve o item.
 */
export function BuscarProdutoRevenda({ onImportado, label, hint }: BuscarProdutoRevendaProps) {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);

  const buscar = async () => {
    if (!codigo.trim()) {
      toast.error("Informe o código do produto");
      return;
    }
    if (!user) return;

    try {
      setCarregando(true);
      const insumo = await importarProdutoRevendaComoInsumo(codigo, user.id);
      onImportado(insumo);
      toast.success(`${insumo.tipo_insumo.descricao} (${insumo.marca}) carregado!`);
      setCodigo("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar produto de revenda");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label || "Produto de Revenda (Natura / Avon) — por código"}</Label>
      <div className="flex gap-2">
        <Input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
          placeholder="Ex: 12345"
        />
        <Button
          type="button"
          onClick={buscar}
          disabled={carregando}
          className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha shrink-0"
        >
          <Search className="h-4 w-4 mr-2" />
          {carregando ? "Buscando..." : "Carregar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {hint || "Digite o código cadastrado em Serviços › Produtos para Revenda para trazer descrição, marca e valor automaticamente."}
      </p>
    </div>
  );
}
