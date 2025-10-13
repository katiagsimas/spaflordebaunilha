import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
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
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Embalagem {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

export default function Embalagens() {
  const navigate = useNavigate();
  const [embalagens, setEmbalagens] = useLocalStorage<Embalagem[]>("embalagens", []);
  const [unidades] = useUnidadesMedida();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmbalagem, setEditingEmbalagem] = useState<Embalagem | null>(null);
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
    if (editingEmbalagem) {
      setFormData(editingEmbalagem);
      setIsDialogOpen(true);
    }
  }, [editingEmbalagem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmbalagem) {
      setEmbalagens(embalagens.map(e => e.id === editingEmbalagem.id ? { ...formData, id: e.id } : e));
      toast.success("Embalagem atualizada com sucesso!");
    } else {
      const newEmbalagem: Embalagem = {
        ...formData,
        id: Date.now().toString(),
      };
      setEmbalagens([...embalagens, newEmbalagem]);
      toast.success("Embalagem cadastrada com sucesso!");
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
    setEditingEmbalagem(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setEmbalagens(embalagens.filter(e => e.id !== id));
    setDeleteId(null);
    toast.success("Embalagem excluída com sucesso!");
  };

  const handleEdit = (embalagem: Embalagem) => {
    setEditingEmbalagem(embalagem);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/cadastros" />
        <div className="flex-1">
          <PageHeader
            title="Embalagens"
            description="Gerencie suas embalagens"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Embalagens</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEmbalagem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Embalagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEmbalagem ? "Editar Embalagem" : "Nova Embalagem"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Embalagem *</Label>
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
                    {editingEmbalagem ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {embalagens.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhuma embalagem cadastrada"
              description="Comece adicionando sua primeira embalagem"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Embalagem</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {embalagens.sort((a, b) => a.nome.localeCompare(b.nome)).map((embalagem) => (
                    <TableRow key={embalagem.id}>
                      <TableCell className="font-medium">{embalagem.nome}</TableCell>
                      <TableCell>{embalagem.marca}</TableCell>
                      <TableCell>{embalagem.quantidade}</TableCell>
                      <TableCell>{embalagem.unidadeMedida}</TableCell>
                      <TableCell>R$ {embalagem.preco.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(embalagem.dataAtualizacao + 'T00:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(embalagem)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(embalagem.id)}
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
        title="Excluir Embalagem"
        description="Tem certeza que deseja excluir esta embalagem? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
