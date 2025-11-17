import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn, formatPhone, formatCpfCnpj } from "@/lib/utils";
import { useFornecedores } from "@/hooks/useFornecedores";
import { toast } from "sonner";

interface FornecedorAutocompleteProps {
  value: string;
  onSelect: (fornecedorId: string, fornecedorNome: string) => void;
  placeholder?: string;
}

export function FornecedorAutocomplete({
  value,
  onSelect,
  placeholder = "Selecione um fornecedor...",
}: FornecedorAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { fornecedores, createFornecedor } = useFornecedores();
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    observacoes: "",
  });

  const filteredFornecedores = fornecedores.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedFornecedor = fornecedores.find(f => f.id === value);

  const handleSelect = (fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    if (fornecedor) {
      onSelect(fornecedor.id, fornecedor.nome);
    }
    setOpen(false);
    setSearchValue("");
  };

  const handleOpenDialog = () => {
    setFormData({
      nome: searchValue,
      tipo: "PF",
      cpf_cnpj: "",
      telefone: "",
      email: "",
      observacoes: "",
    });
    setDialogOpen(true);
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.nome) {
      toast.error("Nome é obrigatório!");
      return;
    }

    try {
      // Limpar campos vazios para evitar erros de validação
      const fornecedorData = {
        nome: formData.nome,
        tipo: formData.tipo,
        cpf_cnpj: formData.cpf_cnpj || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        observacoes: formData.observacoes || null,
      };

      const novoFornecedor = await createFornecedor(fornecedorData);
      
      // Retornar o fornecedor para preencher o campo
      onSelect(novoFornecedor.id, novoFornecedor.nome);
      
      setDialogOpen(false);
      setFormData({
        nome: "",
        tipo: "PF",
        cpf_cnpj: "",
        telefone: "",
        email: "",
        observacoes: "",
      });
      toast.success("Fornecedor cadastrado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar fornecedor");
    }
  };

  const handleCpfCnpjChange = (value: string) => {
    const formatado = formatCpfCnpj(value);
    setFormData({ ...formData, cpf_cnpj: formatado });
  };

  const handleTelefoneChange = (value: string) => {
    const formatado = formatPhone(value);
    setFormData({ ...formData, telefone: formatado });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {selectedFornecedor?.nome || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background" align="start">
        <Command className="bg-background">
          <CommandInput
            placeholder="Buscar fornecedor..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                Nenhum fornecedor encontrado
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDialog}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Fornecedor
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredFornecedores.map((fornecedor) => (
              <CommandItem
                key={fornecedor.id}
                value={fornecedor.nome}
                onSelect={() => handleSelect(fornecedor.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === fornecedor.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{fornecedor.nome}</span>
                  {fornecedor.cpf_cnpj && (
                    <span className="text-xs text-muted-foreground">
                      {fornecedor.cpf_cnpj}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  autoFocus
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
            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder={formData.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
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

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Digite aqui observações sobre o fornecedor..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
