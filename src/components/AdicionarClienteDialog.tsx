import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useClientes } from "@/hooks/useClientes";
import { useViaCEP } from "@/hooks/useViaCEP";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";

interface AdicionarClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteAdicionado?: (cliente: any) => void;
}

export function AdicionarClienteDialog({ open, onOpenChange, onClienteAdicionado }: AdicionarClienteDialogProps) {
  const { createCliente } = useClientes();
  const { buscarCEP, loading: loadingCEP } = useViaCEP();
  const [observacoesOpen, setObservacoesOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF",
    telefone: "",
    email: "",
    cpf_cnpj: "",
    data_aniversario: "",
    cep: "",
    endereco: "",
    numero: "",
    cidade: "",
    estado: "",
    observacoes: "",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "PF",
      telefone: "",
      email: "",
      cpf_cnpj: "",
      data_aniversario: "",
      cep: "",
      endereco: "",
      numero: "",
      cidade: "",
      estado: "",
      observacoes: "",
    });
    setObservacoesOpen(false);
  };

  const handleBuscarCEP = async () => {
    const endereco = await buscarCEP(formData.cep);
    if (endereco) {
      setFormData({
        ...formData,
        endereco: endereco.endereco || formData.endereco,
        cidade: endereco.cidade || formData.cidade,
        estado: endereco.estado || formData.estado,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast.error("Nome é obrigatório!");
      return;
    }

    try {
      // Converter campos de data vazios para null
      const dadosLimpos = {
        ...formData,
        data_aniversario: formData.data_aniversario || null,
      };
      
      const novoCliente = await createCliente(dadosLimpos);
      toast.success("Cliente cadastrado com sucesso!");
      
      // Notifica o componente pai com o cliente criado
      if (onClienteAdicionado && novoCliente) {
        onClienteAdicionado(novoCliente);
      }
      
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
    }
  };

  // Reset form quando o dialog fechar
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Principais */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_aniversario">Data de Aniversário</Label>
              <Input
                id="data_aniversario"
                type="date"
                value={formData.data_aniversario}
                onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                  <Button
                    type="button"
                    onClick={handleBuscarCEP}
                    disabled={loadingCEP || !formData.cep}
                    variant="outline"
                  >
                    {loadingCEP ? "..." : "Buscar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Avenida..."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <Collapsible open={observacoesOpen} onOpenChange={setObservacoesOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${observacoesOpen ? "rotate-180" : ""}`} />
                Observações Adicionais
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={4}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
