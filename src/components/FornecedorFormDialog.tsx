import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronDown } from 'lucide-react';
import { formatPhone, formatCpfCnpj } from '@/lib/utils';

interface FornecedorFormData {
  nome: string;
  tipo: 'PF' | 'PJ';
  tipo_fornecedor: 'Insumos' | 'Embalagens' | 'Diversos' | 'Papelaria Personalizada' | 'Outros';
  cpf_cnpj: string;
  telefone: string;
  email: string;
  contato: string;
  data_aniversario_contato: string;
  observacoes: string;
}

interface FornecedorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FornecedorFormData) => Promise<void>;
  initialData?: Partial<FornecedorFormData>;
  loading?: boolean;
}

const defaultFormData: FornecedorFormData = {
  nome: '',
  tipo: 'PF',
  tipo_fornecedor: 'Insumos',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  contato: '',
  data_aniversario_contato: '',
  observacoes: '',
};

export function FornecedorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
}: FornecedorFormDialogProps) {
  const [formData, setFormData] = useState<FornecedorFormData>(defaultFormData);
  const [observacoesOpen, setObservacoesOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        ...defaultFormData,
        ...initialData,
      });
      setObservacoesOpen(false);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      return; // O campo nome já tem required, mas adiciona validação extra
    }
    
    // Converter campos de data vazios para null
    const dadosLimpos = {
      ...formData,
      data_aniversario_contato: formData.data_aniversario_contato || null,
    };
    
    await onSubmit(dadosLimpos);
  };

  const handleCancel = () => {
    setFormData(defaultFormData);
    setObservacoesOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.nome ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="tipo">PF ou PJ</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'PF' | 'PJ') => setFormData({ ...formData, tipo: value })}
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
              <Label htmlFor="cpf_cnpj">CNPJ/CPF</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
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
            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_aniversario_contato">Aniversário do Contato</Label>
              <Input
                id="data_aniversario_contato"
                type="date"
                value={formData.data_aniversario_contato}
                onChange={(e) =>
                  setFormData({ ...formData, data_aniversario_contato: e.target.value })
                }
              />
            </div>
          </div>

          <Collapsible open={observacoesOpen} onOpenChange={setObservacoesOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <ChevronDown className="h-4 w-4 mr-2" />
                Observações
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Digite aqui observações sobre o fornecedor..."
                rows={4}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {initialData?.nome ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
