import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Pencil, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Ingrediente {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

export default function Ingredientes() {
  const [ingredientes, setIngredientes] = useLocalStorage<Ingrediente[]>("ingredientes", []);
  const [unidades] = useLocalStorage<{ id: string; nome: string; sigla: string }[]>("unidadesMedida", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    marca: "",
    quantidade: 0,
    unidadeMedida: "",
    preco: 0,
    dataAtualizacao: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editingIngrediente) {
      setFormData(editingIngrediente);
      setIsDialogOpen(true);
    }
  }, [editingIngrediente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingIngrediente) {
      setIngredientes(ingredientes.map(i => i.id === editingIngrediente.id ? { ...formData, id: i.id } : i));
      toast.success("Ingrediente atualizado com sucesso!");
    } else {
      const newIngrediente: Ingrediente = {
        ...formData,
        id: Date.now().toString(),
      };
      setIngredientes([...ingredientes, newIngrediente]);
      toast.success("Ingrediente cadastrado com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      marca: "",
      quantidade: 0,
      unidadeMedida: "",
      preco: 0,
      dataAtualizacao: new Date().toISOString().split('T')[0],
    });
    setEditingIngrediente(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setIngredientes(ingredientes.filter(i => i.id !== id));
    setDeleteId(null);
    toast.success("Ingrediente excluído com sucesso!");
  };

  const handleEdit = (ingrediente: Ingrediente) => {
    setEditingIngrediente(ingrediente);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredientes"
        description="Gerencie seus ingredientes e insumos"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Ingredientes</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingIngrediente(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingIngrediente ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Ingrediente *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade na Embalagem *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="0.01"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidadeMedida">Unidade de Medida *</Label>
                    <Select
                      value={formData.unidadeMedida}
                      onValueChange={(value) => setFormData({ ...formData, unidadeMedida: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.sigla}>
                            {unidade.nome} ({unidade.sigla})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço (R$) *</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataAtualizacao">Data de Atualização</Label>
                    <Input
                      id="dataAtualizacao"
                      type="date"
                      value={formData.dataAtualizacao}
                      onChange={(e) => setFormData({ ...formData, dataAtualizacao: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingIngrediente ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {ingredientes.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="Nenhum ingrediente cadastrado"
              description="Comece adicionando seu primeiro ingrediente"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientes.map((ingrediente) => (
                    <TableRow key={ingrediente.id}>
                      <TableCell className="font-medium">{ingrediente.nome}</TableCell>
                      <TableCell>{ingrediente.marca}</TableCell>
                      <TableCell>{ingrediente.quantidade}</TableCell>
                      <TableCell>{ingrediente.unidadeMedida}</TableCell>
                      <TableCell>R$ {ingrediente.preco.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(ingrediente.dataAtualizacao + 'T00:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(ingrediente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(ingrediente.id)}
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
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir Ingrediente"
        description="Tem certeza que deseja excluir este ingrediente? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
