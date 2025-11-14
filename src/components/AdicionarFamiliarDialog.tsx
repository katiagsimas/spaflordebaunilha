import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useFamiliares } from "@/hooks/useFamiliares";

interface AdicionarFamiliarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNome: string;
  editingFamiliar?: any;
  onFamiliarAdded?: () => void;
}

const grausParentesco = [
  "Pai/Mãe",
  "Filho(a)",
  "Esposo(a)",
  "Irmão(ã)",
  "Avô(ó)",
  "Neto(a)",
  "Primo(a)",
  "Tio(a)",
  "Sobrinho(a)",
  "Outro"
];

export function AdicionarFamiliarDialog({
  open,
  onOpenChange,
  clienteId,
  clienteNome,
  editingFamiliar,
  onFamiliarAdded,
}: AdicionarFamiliarDialogProps) {
  const { createFamiliar, updateFamiliar } = useFamiliares(clienteId);
  const [cadastrarOutro, setCadastrarOutro] = useState(false);
  const [mostrarPergunta, setMostrarPergunta] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    parentesco: "",
    data_nascimento: "",
    observacoes: "",
  });

  useEffect(() => {
    if (editingFamiliar) {
      setFormData({
        nome: editingFamiliar.nome || "",
        parentesco: editingFamiliar.parentesco || "",
        data_nascimento: editingFamiliar.data_nascimento || "",
        observacoes: editingFamiliar.observacoes || "",
      });
      setMostrarPergunta(false);
    } else {
      resetForm();
    }
  }, [editingFamiliar, open]);

  const resetForm = () => {
    setFormData({
      nome: "",
      parentesco: "",
      data_nascimento: "",
      observacoes: "",
    });
    setMostrarPergunta(false);
    setCadastrarOutro(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.data_nascimento) {
      toast.error("Nome e Data de Aniversário são obrigatórios!");
      return;
    }

    try {
      const dadosLimpos = {
        ...formData,
        cliente_id: clienteId,
        ativo: true,
      };

      if (editingFamiliar) {
        await updateFamiliar(editingFamiliar.id, dadosLimpos);
        onFamiliarAdded?.();
        onOpenChange(false);
      } else {
        await createFamiliar(dadosLimpos);
        onFamiliarAdded?.();
        
        // Mostrar pergunta sobre cadastrar outro
        setMostrarPergunta(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar familiar");
    }
  };

  const handleRespostaPergunta = () => {
    if (cadastrarOutro) {
      // Limpar formulário para novo cadastro
      resetForm();
      setMostrarPergunta(false);
    } else {
      // Fechar dialog e notificar atualização
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingFamiliar ? "Editar Familiar" : "Adicionar Familiar"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Cliente: {clienteNome}
          </p>
        </DialogHeader>

        {!mostrarPergunta ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentesco">Grau de Parentesco</Label>
              <Select
                value={formData.parentesco}
                onValueChange={(value) => setFormData({ ...formData, parentesco: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {grausParentesco.map((grau) => (
                    <SelectItem key={grau} value={grau}>
                      {grau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Aniversário *</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFamiliar ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-center">Deseja cadastrar outro familiar?</p>
            <div className="flex items-center justify-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={cadastrarOutro === true}
                  onCheckedChange={() => setCadastrarOutro(true)}
                />
                <span>SIM</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={cadastrarOutro === false}
                  onCheckedChange={() => setCadastrarOutro(false)}
                />
                <span>NÃO</span>
              </label>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleRespostaPergunta}>
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
