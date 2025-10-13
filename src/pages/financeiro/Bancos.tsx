import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

interface Banco {
  id: string;
  codigo: string;
  descricao: string;
}

const bancosIniciais: Banco[] = [
  { id: "1", codigo: "001", descricao: "Banco do Brasil" },
  { id: "2", codigo: "033", descricao: "Santander" },
  { id: "3", codigo: "104", descricao: "Caixa Econômica Federal" },
  { id: "4", codigo: "237", descricao: "Bradesco" },
  { id: "5", codigo: "341", descricao: "Itaú Unibanco" },
  { id: "6", codigo: "260", descricao: "Nubank" },
  { id: "7", codigo: "077", descricao: "Banco Inter" },
  { id: "8", codigo: "290", descricao: "PagSeguro" },
  { id: "9", codigo: "336", descricao: "C6 Bank" },
  { id: "10", codigo: "323", descricao: "Mercado Pago" },
];

export default function Bancos() {
  const [bancos, setBancos] = useLocalStorage<Banco[]>("sugarbox_bancos", bancosIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<Banco | null>(null);
  const [bancoToDelete, setBancoToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
  });

  const resetForm = () => {
    setFormData({ codigo: "", descricao: "" });
    setEditingBanco(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBanco) {
      setBancos(bancos.map(b => 
        b.id === editingBanco.id 
          ? { ...editingBanco, ...formData }
          : b
      ));
      toast.success("Banco atualizado com sucesso!");
    } else {
      const novoBanco: Banco = {
        id: Date.now().toString(),
        ...formData,
      };
      setBancos([...bancos, novoBanco]);
      toast.success("Banco criado com sucesso!");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (banco: Banco) => {
    setEditingBanco(banco);
    setFormData({
      codigo: banco.codigo,
      descricao: banco.descricao,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (bancoToDelete) {
      setBancos(bancos.filter(b => b.id !== bancoToDelete));
      toast.success("Banco excluído com sucesso!");
      setDeleteDialogOpen(false);
      setBancoToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <BackButton to="/financeiro/configuracoes" />
      </div>
      
      <PageHeader
        title="Bancos"
        description="Gerencie as instituições bancárias utilizadas"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Banco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBanco ? "Editar Banco" : "Novo Banco"}
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
                    placeholder="Ex: 001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                    placeholder="Ex: Banco do Brasil"
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

      {bancos.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum banco cadastrado"
          description="Comece criando seu primeiro banco"
          actionLabel="Novo Banco"
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
              {bancos.map((banco) => (
                <TableRow key={banco.id}>
                  <TableCell className="font-medium">{banco.codigo}</TableCell>
                  <TableCell>{banco.descricao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(banco)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setBancoToDelete(banco.id);
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
        title="Excluir Banco"
        description="Tem certeza que deseja excluir este banco? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
