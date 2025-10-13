import { useState } from "react";
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

interface TipoDocumento {
  id: string;
  codigo: string;
  descricao: string;
}

const tiposIniciais: TipoDocumento[] = [
  { id: "1", codigo: "01", descricao: "Caixa Empresa" },
  { id: "2", codigo: "02", descricao: "PIX" },
  { id: "3", codigo: "03", descricao: "Cartão de Crédito" },
  { id: "4", codigo: "04", descricao: "Cartão de Débito" },
  { id: "5", codigo: "05", descricao: "Boleto Bancário" },
  { id: "6", codigo: "06", descricao: "Transferência Bancária" },
  { id: "7", codigo: "07", descricao: "Dinheiro" },
  { id: "8", codigo: "08", descricao: "Cheque" },
];

export default function TiposDocumento() {
  const [tipos, setTipos] = useLocalStorage<TipoDocumento[]>("sugarbox_tipos_documento", tiposIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoDocumento | null>(null);
  const [tipoToDelete, setTipoToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
  });

  const resetForm = () => {
    setFormData({ codigo: "", descricao: "" });
    setEditingTipo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTipo) {
      setTipos(tipos.map(t => 
        t.id === editingTipo.id 
          ? { ...editingTipo, ...formData }
          : t
      ));
      toast.success("Tipo de documento atualizado com sucesso!");
    } else {
      const novoTipo: TipoDocumento = {
        id: Date.now().toString(),
        ...formData,
      };
      setTipos([...tipos, novoTipo]);
      toast.success("Tipo de documento criado com sucesso!");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (tipo: TipoDocumento) => {
    setEditingTipo(tipo);
    setFormData({
      codigo: tipo.codigo,
      descricao: tipo.descricao,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (tipoToDelete) {
      setTipos(tipos.filter(t => t.id !== tipoToDelete));
      toast.success("Tipo de documento excluído com sucesso!");
      setDeleteDialogOpen(false);
      setTipoToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Tipos de Documento"
        description="Cadastre formas de pagamento e tipos de documento"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTipo ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {tipos.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum tipo de documento cadastrado"
          description="Comece criando seu primeiro tipo de documento"
          actionLabel="Novo Tipo"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">{tipo.codigo}</TableCell>
                  <TableCell>{tipo.descricao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tipo)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTipoToDelete(tipo.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Tipo de Documento"
        description="Tem certeza que deseja excluir este tipo de documento? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
