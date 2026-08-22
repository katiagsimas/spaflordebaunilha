import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Tag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  importarProdutoRevendaComoInsumo,
  ProdutoSemPrecoError,
  type InsumoImportado,
} from "@/lib/produtoRevenda";

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
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [semPreco, setSemPreco] = useState<{ marca: string; codigo: string; descricao: string } | null>(null);

  const buscar = async () => {
    if (!codigo.trim()) {
      toast.error("Informe o código do produto");
      return;
    }
    if (!user) return;

    try {
      setCarregando(true);
      setSemPreco(null);
      const insumo = await importarProdutoRevendaComoInsumo(codigo, user.id);
      onImportado(insumo);
      toast.success(`${insumo.tipo_insumo.descricao} (${insumo.marca}) carregado!`);
      setCodigo("");
    } catch (error: any) {
      if (error instanceof ProdutoSemPrecoError) {
        setSemPreco({ marca: error.marca, codigo: error.codigo, descricao: error.descricao });
      }
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

      {semPreco && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sfb-terracota/40 bg-sfb-terracota/10 px-3 py-2">
          <p className="flex-1 text-xs text-sfb-cacau">
            <strong>{semPreco.descricao}</strong> está sem preço cadastrado.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              navigate(`/precificacao/produtos-revenda/${semPreco.marca}?codigo=${encodeURIComponent(semPreco.codigo)}`)
            }
            className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha gap-2"
          >
            <Tag className="h-4 w-4" /> Cadastrar preço
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {hint || "Digite o código cadastrado em Serviços › Produtos para Revenda para trazer descrição, marca e valor automaticamente."}
      </p>
    </div>
  );
}

