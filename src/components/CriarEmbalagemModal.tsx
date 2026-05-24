import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Unidade {
  id: string;
  nome: string;
  sigla: string;
}

interface CriarEmbalagemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  descricaoInicial: string;
  unidades: Unidade[];
  userId: string | undefined;
  onEmbalagemCriada: (data: any) => void;
}

export function CriarEmbalagemModal({
  open,
  onOpenChange,
  descricaoInicial,
  unidades,
  userId,
  onEmbalagemCriada,
}: CriarEmbalagemModalProps) {
  const [step, setStep] = useState<"tipo" | "detalhe">("tipo");
  const [novoTipoDescricao, setNovoTipoDescricao] = useState("");
  const [novoTipoQuantidade, setNovoTipoQuantidade] = useState("");
  const [novoTipoUnidadeId, setNovoTipoUnidadeId] = useState("");
  const [novoMarca, setNovoMarca] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [tipoRecemCriado, setTipoRecemCriado] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setStep("tipo");
      setNovoTipoDescricao(descricaoInicial);
      setNovoTipoQuantidade("");
      setNovoTipoUnidadeId("");
      setNovoMarca("");
      setNovoPreco("");
      setTipoRecemCriado(null);
    }
  }, [open, descricaoInicial]);

  const handleCriarTipo = async () => {
    try {
      if (!novoTipoDescricao.trim() || !novoTipoQuantidade || !novoTipoUnidadeId) {
        toast.error("Preencha todos os campos!");
        return;
      }

      const qtd = parseFloat(novoTipoQuantidade.replace(",", "."));
      if (qtd <= 0) {
        toast.error("Quantidade deve ser maior que zero!");
        return;
      }

      if (!userId) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("tipos_insumos")
        .insert({
          usuario_id: userId,
          tipo: "embalagem",
          descricao: novoTipoDescricao.trim(),
          quantidade_embalagem: qtd,
          unidade_medida_id: novoTipoUnidadeId,
        })
        .select(
          `
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `,
        )
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este tipo já foi cadastrado!");
        }
        throw error;
      }

      toast.success("Tipo cadastrado! Agora vamos cadastrar a embalagem.");
      setTipoRecemCriado(data);
      setNovoMarca("");
      setNovoPreco("");
      setStep("detalhe");
    } catch (error: any) {
      console.error("Erro ao criar tipo:", error);
      toast.error(error.message);
    }
  };

  const handleCriarEmbalagem = async () => {
    try {
      if (!tipoRecemCriado) {
        throw new Error("Tipo não encontrado");
      }

      const precoNum = parseFloat(novoPreco.replace(",", "."));
      if (!precoNum || precoNum <= 0) {
        toast.error("Informe um preço válido!");
        return;
      }

      if (!userId) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("embalagens")
        .insert({
          usuario_id: userId,
          tipo_insumo_id: tipoRecemCriado.id,
          marca: novoMarca.trim() || null,
          preco: precoNum,
          data_atualizacao: new Date().toISOString().split("T")[0],
        })
        .select(
          `
          *,
          tipo_insumo:tipos_insumos (
            id,
            descricao,
            quantidade_embalagem,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `,
        )
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Esta embalagem já foi cadastrada!");
        }
        throw error;
      }

      toast.success("Embalagem cadastrada e adicionada!");
      onEmbalagemCriada(data);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar embalagem:", error);
      toast.error(error.message);
    }
  };

  if (step === "tipo") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Embalagem</DialogTitle>
            <DialogDescription>
              Cadastre o tipo base da embalagem com sua quantidade padrão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descricao-emb">Nome da Embalagem *</Label>
              <Input
                id="descricao-emb"
                placeholder="Ex: Caixa de Papelão"
                value={novoTipoDescricao}
                onChange={(e) => setNovoTipoDescricao(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade-emb">Qtde na Embalagem *</Label>
                <Input
                  id="quantidade-emb"
                  type="text"
                  placeholder="Ex: 1"
                  value={novoTipoQuantidade}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, "");
                    setNovoTipoQuantidade(valor);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade-emb">Unidade de Medida *</Label>
                <Select value={novoTipoUnidadeId} onValueChange={setNovoTipoUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarTipo}>Próximo: Cadastrar Embalagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Embalagem</DialogTitle>
          {tipoRecemCriado && (
            <p className="text-sm text-muted-foreground">
              Tipo: {tipoRecemCriado.descricao} - {tipoRecemCriado.quantidade_embalagem}{" "}
              {tipoRecemCriado.unidade_medida?.sigla}
            </p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Marca</Label>
            <Input
              value={novoMarca}
              onChange={(e) => setNovoMarca(e.target.value)}
              placeholder="Ex: Marca X"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Preço *</Label>
            <Input
              type="text"
              value={novoPreco}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^\d,]/g, "");
                setNovoPreco(valor);
              }}
              placeholder="Ex: 5,00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCriarEmbalagem}>Cadastrar e Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
