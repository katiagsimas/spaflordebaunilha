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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProdutoRevendaForm } from "@/components/ProdutoRevendaForm";

interface BuscarProdutoRevendaProps {
  onImportado: (insumo: InsumoImportado) => void;
  label?: string;
  hint?: string;
  origem?: "servicos" | "estoque";
}

/**
 * Campo de busca por código de produto Natura/Avon.
 * Ao localizar, converte o produto em insumo (persistido no banco) e devolve o item.
 */
export function BuscarProdutoRevenda({ onImportado, label, hint, origem = "servicos" }: BuscarProdutoRevendaProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [semPreco, setSemPreco] = useState<{ marca: string; codigo: string; descricao: string } | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [marcaSelecionada, setMarcaSelecionada] = useState<'natura' | 'avon' | null>(null);

  const buscar = async (codigoForcado?: string, isNovoCadastro: boolean = false) => {
    const cod = codigoForcado || codigo;
    if (!cod.trim()) {
      toast.error("Informe o código do produto");
      return;
    }
    if (!user) return;

    try {
      setCarregando(true);
      setSemPreco(null);
      const insumo = await importarProdutoRevendaComoInsumo(cod, user.id);
      onImportado(insumo);
      
      if (isNovoCadastro) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sfb-cacau">Novo item criado e adicionado!</span>
            <span className="text-xs opacity-90">{insumo.tipo_insumo.descricao} ({insumo.marca})</span>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success(`${insumo.tipo_insumo.descricao} (${insumo.marca}) carregado!`);
      }
      
      setCodigo("");
    } catch (error: any) {
      if (error instanceof ProdutoSemPrecoError) {
        setSemPreco({ marca: error.marca, codigo: error.codigo, descricao: error.descricao });
        toast.error(error.message);
      } else if (error.message?.includes("não encontrado")) {
        setModalNovoAberto(true);
      } else {
        toast.error(error.message || "Erro ao buscar produto de revenda");
      }
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
          onClick={() => buscar()}
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
              navigate(`/cadastros/produtos-revenda/${semPreco.marca}?codigo=${encodeURIComponent(semPreco.codigo)}`)
            }
            className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha gap-2"
          >
            <Tag className="h-4 w-4" /> Cadastrar preço
          </Button>
        </div>
      )}

      <Dialog open={modalNovoAberto} onOpenChange={(open) => {
        setModalNovoAberto(open);
        if (!open) setMarcaSelecionada(null);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produto não encontrado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!marcaSelecionada ? (
              <>
                <p className="text-sm text-sfb-cacau">
                  O código <strong>{codigo}</strong> não foi localizado. Deseja cadastrá-lo agora?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="border-sfb-areia text-sfb-cacau"
                    onClick={() => setMarcaSelecionada('natura')}
                  >
                    Cadastrar Natura
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-sfb-areia text-sfb-cacau"
                    onClick={() => setMarcaSelecionada('avon')}
                  >
                    Cadastrar Avon
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-sfb-cacau">Novo Produto {marcaSelecionada === 'natura' ? 'Natura' : 'Avon'}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setMarcaSelecionada(null)} className="text-xs h-7 px-2">
                    Alterar marca
                  </Button>
                </div>
                <ProdutoRevendaForm 
                  marca={marcaSelecionada} 
                  produto={{ codigo } as any} 
                  onSuccess={() => {
                    const codSalvo = codigo;
                    setModalNovoAberto(false);
                    setMarcaSelecionada(null);
                    // Tenta buscar novamente o código que acabou de ser cadastrado, indicando que é um novo cadastro
                    setTimeout(() => buscar(codSalvo, true), 500);

                  }} 
                />
              </div>
            )}
          </div>
          <DialogFooter>
            {!marcaSelecionada && (
               <Button variant="ghost" onClick={() => setModalNovoAberto(false)}>Cancelar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        {hint || "Digite o código cadastrado em Cadastros › Produtos para Revenda para trazer descrição, marca e valor automaticamente."}
      </p>
    </div>
  );
}


