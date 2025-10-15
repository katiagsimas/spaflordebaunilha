import { useState, useEffect } from "react";
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTiposDocumento } from "@/hooks/useTiposDocumento";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

const tiposIniciais = [
  { codigo: "01", descricao: "Dinheiro" },
  { codigo: "02", descricao: "PIX" },
  { codigo: "03", descricao: "Cartão de Crédito" },
  { codigo: "04", descricao: "Cartão de Débito" },
  { codigo: "05", descricao: "Boleto Bancário" },
  { codigo: "06", descricao: "Transferência Bancária" },
  { codigo: "07", descricao: "Cheque" },
];

export default function TiposDocumento() {
  const { tiposDocumento, loading, createTipoDocumento, updateTipoDocumento, deleteTipoDocumento } = useTiposDocumento();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<any>(null);
  const [tipoToDelete, setTipoToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
  });

  // Popular com dados iniciais se estiver vazio
  useEffect(() => {
    const popularDadosIniciais = async () => {
      if (!loading && tiposDocumento.length === 0) {
        try {
          for (const tipo of tiposIniciais) {
            await createTipoDocumento(tipo);
          }
        } catch (error) {
          console.error('Erro ao popular tipos de documento:', error);
        }
      }
    };
    popularDadosIniciais();
  }, [loading, tiposDocumento.length]);

  const resetForm = () => {
    setFormData({ codigo: "", descricao: "" });
    setEditingTipo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTipo) {
        await updateTipoDocumento(editingTipo.id, formData);
      } else {
        await createTipoDocumento(formData);
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar tipo de documento:', error);
    }
  };

  const handleEdit = (tipo: any) => {
    setEditingTipo(tipo);
    setFormData({
      codigo: tipo.codigo,
      descricao: tipo.descricao,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (tipoToDelete) {
      try {
        await deleteTipoDocumento(tipoToDelete);
        setDeleteDialogOpen(false);
        setTipoToDelete(null);
      } catch (error) {
        console.error('Erro ao deletar tipo de documento:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <BackButton to="/configuracoes" />
      </div>
      
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

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : tiposDocumento.length === 0 ? (
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
              {tiposDocumento.map((tipo) => (
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
