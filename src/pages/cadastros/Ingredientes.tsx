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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { TipoInsumoAutocomplete } from "@/components/TipoInsumoAutocomplete";
import { TipoInsumo } from "@/hooks/useTiposInsumos";
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

export default function MateriaPrima() {
  const navigate = useNavigate();
  const [ingredientes, setIngredientes] = useLocalStorage<Ingrediente[]>("ingredientes", []);
  const { unidades } = useUnidadesMedida();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showZeroPriceConfirm, setShowZeroPriceConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const [selectedTipoId, setSelectedTipoId] = useState<string>("");

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
      setSelectedTipoId("");
      setIsDialogOpen(true);
    }
  }, [editingIngrediente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: não permitir submissão com campos vazios
    if (!formData.nome || !formData.unidadeMedida || formData.quantidade <= 0) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    // Se o preço for zero, mostrar confirmação
    if (formData.preco === 0 || formData.preco < 0) {
      setPendingFormData(formData);
      setShowZeroPriceConfirm(true);
      return;
    }

    saveIngrediente(formData);
  };

  const saveIngrediente = (data: typeof formData) => {
    if (editingIngrediente) {
      setIngredientes(ingredientes.map(i => i.id === editingIngrediente.id ? { ...data, id: i.id } : i));
      toast.success("Matéria-prima atualizada com sucesso!");
    } else {
      const newIngrediente: Ingrediente = {
        ...data,
        id: Date.now().toString(),
      };
      setIngredientes([...ingredientes, newIngrediente]);
      toast.success("Matéria-prima cadastrada com sucesso!");
    }

    resetForm();
  };

  const handleConfirmZeroPrice = () => {
    if (pendingFormData) {
      saveIngrediente(pendingFormData);
      setPendingFormData(null);
    }
    setShowZeroPriceConfirm(false);
  };

  const handleTipoSelect = (tipo: TipoInsumo) => {
    const unidade = unidades.find((u) => u.id === tipo.unidade_medida_id);
    setSelectedTipoId(tipo.id);
    setFormData(prev => ({
      ...prev,
      nome: tipo.descricao,
      quantidade: tipo.quantidade_embalagem,
      unidadeMedida: unidade?.sigla || "",
    }));
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
    setSelectedTipoId("");
    setEditingIngrediente(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setIngredientes(ingredientes.filter(i => i.id !== id));
    setDeleteId(null);
    toast.success("Matéria-prima excluída com sucesso!");
  };

  const handleEdit = (ingrediente: Ingrediente) => {
    setEditingIngrediente(ingrediente);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/precificacao" />
        <div className="flex-1">
          <PageHeader
            title="Matéria-prima"
            description="Gerencie sua matéria-prima e insumos"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Matéria-prima</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingIngrediente(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Matéria-prima
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingIngrediente ? "Editar Matéria-prima" : "Nova Matéria-prima"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Buscar Tipo de Insumo</Label>
                    <TipoInsumoAutocomplete
                      onSelect={handleTipoSelect}
                      value={selectedTipoId}
                    />
                    <p className="text-xs text-muted-foreground">
                      Selecione um tipo para preencher automaticamente nome, quantidade e unidade
                    </p>
                  </div>
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
                      min="0"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
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
              title="Nenhuma matéria-prima cadastrada"
              description="Comece adicionando sua primeira matéria-prima"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matéria-prima</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientes.sort((a, b) => a.nome.localeCompare(b.nome)).map((ingrediente) => (
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
        title="Excluir Matéria-prima"
        description="Tem certeza que deseja excluir esta matéria-prima? Esta ação não pode ser desfeita."
      />

      <AlertDialog open={showZeroPriceConfirm} onOpenChange={setShowZeroPriceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Preço Zerado</AlertDialogTitle>
            <AlertDialogDescription>
              O preço informado é R$ 0,00. Tem certeza que deseja cadastrar a matéria-prima com este valor?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowZeroPriceConfirm(false);
              setPendingFormData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmZeroPrice}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
