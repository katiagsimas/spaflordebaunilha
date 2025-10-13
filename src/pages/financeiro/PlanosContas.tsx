import { useState } from "react";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlanoConta {
  id: string;
  codigo: string;
  codigoEstruturado: string;
  descricao: string;
  categoriaId: string;
}

const planosIniciais: PlanoConta[] = [
  { id: "1", codigo: "1.01", codigoEstruturado: "1.01.001", descricao: "Vendas de Produtos", categoriaId: "1" },
  { id: "2", codigo: "1.02", codigoEstruturado: "1.02.001", descricao: "Receita de Serviços", categoriaId: "1" },
  { id: "3", codigo: "2.01", codigoEstruturado: "2.01.001", descricao: "Impostos sobre Vendas", categoriaId: "2" },
  { id: "4", codigo: "3.01", codigoEstruturado: "3.01.001", descricao: "Custo de Matéria-Prima", categoriaId: "3" },
  { id: "5", codigo: "3.02", codigoEstruturado: "3.02.001", descricao: "Custo de Embalagens", categoriaId: "3" },
  { id: "6", codigo: "4.01", codigoEstruturado: "4.01.001", descricao: "Aluguel", categoriaId: "4" },
  { id: "7", codigo: "4.02", codigoEstruturado: "4.02.001", descricao: "Energia Elétrica", categoriaId: "4" },
  { id: "8", codigo: "5.01", codigoEstruturado: "5.01.001", descricao: "Salários e Encargos", categoriaId: "5" },
  { id: "9", codigo: "6.01", codigoEstruturado: "6.01.001", descricao: "Marketing e Publicidade", categoriaId: "6" },
  { id: "10", codigo: "7.01", codigoEstruturado: "7.01.001", descricao: "Rendimento de Aplicações", categoriaId: "7" },
  { id: "11", codigo: "8.01", codigoEstruturado: "8.01.001", descricao: "Juros de Empréstimos", categoriaId: "8" },
];

export default function PlanosContas() {
  const [planos, setPlanos] = useLocalStorage<PlanoConta[]>("sugarbox_planos_contas", planosIniciais);
  const [categorias] = useLocalStorage("sugarbox_categorias_plano", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoConta | null>(null);
  const [planoToDelete, setPlanoToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    codigoEstruturado: "",
    descricao: "",
    categoriaId: "",
  });

  const resetForm = () => {
    setFormData({ codigo: "", codigoEstruturado: "", descricao: "", categoriaId: "" });
    setEditingPlano(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPlano) {
      setPlanos(planos.map(p => 
        p.id === editingPlano.id 
          ? { ...editingPlano, ...formData }
          : p
      ));
      toast.success("Plano de conta atualizado com sucesso!");
    } else {
      const novoPlano: PlanoConta = {
        id: Date.now().toString(),
        ...formData,
      };
      setPlanos([...planos, novoPlano]);
      toast.success("Plano de conta criado com sucesso!");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (plano: PlanoConta) => {
    setEditingPlano(plano);
    setFormData({
      codigo: plano.codigo,
      codigoEstruturado: plano.codigoEstruturado,
      descricao: plano.descricao,
      categoriaId: plano.categoriaId,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (planoToDelete) {
      setPlanos(planos.filter(p => p.id !== planoToDelete));
      toast.success("Plano de conta excluído com sucesso!");
      setDeleteDialogOpen(false);
      setPlanoToDelete(null);
    }
  };

  const getCategoriaDescricao = (categoriaId: string) => {
    const categoria = categorias.find((c: any) => c.id === categoriaId);
    return categoria?.descricao || "N/A";
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Planos de Contas"
        description="Configure e organize seu plano de contas contábil"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano de Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlano ? "Editar Plano de Conta" : "Novo Plano de Conta"}
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
                  <Label htmlFor="codigoEstruturado">Código Estruturado</Label>
                  <Input
                    id="codigoEstruturado"
                    value={formData.codigoEstruturado}
                    onChange={(e) => setFormData({ ...formData, codigoEstruturado: e.target.value })}
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
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoriaId}
                    onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {planos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum plano de conta cadastrado"
          description="Comece criando seu primeiro plano de conta"
          actionLabel="Novo Plano de Conta"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Código Estruturado</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.map((plano) => (
                <TableRow key={plano.id}>
                  <TableCell className="font-medium">{plano.codigo}</TableCell>
                  <TableCell>{plano.codigoEstruturado}</TableCell>
                  <TableCell>{plano.descricao}</TableCell>
                  <TableCell>{getCategoriaDescricao(plano.categoriaId)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plano)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPlanoToDelete(plano.id);
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
        title="Excluir Plano de Conta"
        description="Tem certeza que deseja excluir este plano de conta? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
