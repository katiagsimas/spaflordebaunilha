import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ContatoFormData {
  nome: string;
  cargo: string;
  data_aniversario: string;
  telefone: string;
  observacoes: string;
}

interface AdicionarContatoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContatoFormData, cadastrarOutro: boolean) => Promise<void>;
  initialData?: Partial<ContatoFormData>;
  fornecedorId: string;
  fornecedorNome?: string;
}

const defaultFormData: ContatoFormData = {
  nome: '',
  cargo: '',
  data_aniversario: '',
  telefone: '',
  observacoes: '',
};

export function AdicionarContatoDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  fornecedorId,
  fornecedorNome,
}: AdicionarContatoDialogProps) {
  const [formData, setFormData] = useState<ContatoFormData>(defaultFormData);
  const [showCadastrarOutro, setShowCadastrarOutro] = useState(false);
  const [cadastrarOutro, setCadastrarOutro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({ ...defaultFormData, ...initialData });
        setShowCadastrarOutro(false);
      } else {
        setFormData(defaultFormData);
        setShowCadastrarOutro(false);
      }
      setCadastrarOutro(false);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast.error('Nome é obrigatório!');
      return;
    }

    if (!formData.data_aniversario) {
      toast.error('Data de Aniversário é obrigatória!');
      return;
    }

    try {
      setLoading(true);

      // Se está editando, não mostra a opção de cadastrar outro
      if (initialData) {
        await onSubmit(formData, false);
        onOpenChange(false);
      } else {
        // Se é um novo cadastro, mostra a opção
        setShowCadastrarOutro(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast.error('Erro ao salvar contato: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarCadastro = async () => {
    try {
      setLoading(true);
      await onSubmit(formData, cadastrarOutro);

      if (cadastrarOutro) {
        // Limpa o formulário para novo cadastro
        setFormData(defaultFormData);
        setShowCadastrarOutro(false);
        setCadastrarOutro(false);
      } else {
        // Fecha o diálogo
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast.error('Erro ao salvar contato: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Contato' : 'Adicionar Contato'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fornecedor: {fornecedorNome}
          </p>
        </DialogHeader>

        {!showCadastrarOutro ? (
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
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Gerente, Vendedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_aniversario">Data de Aniversário *</Label>
              <Input
                id="data_aniversario"
                type="date"
                value={formData.data_aniversario}
                onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
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
                {initialData ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-center">Deseja cadastrar outro contato?</p>
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
              <Button onClick={handleConfirmarCadastro}>
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
