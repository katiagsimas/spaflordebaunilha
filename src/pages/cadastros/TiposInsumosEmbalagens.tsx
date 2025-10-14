import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useTiposInsumos, TipoInsumo } from "@/hooks/useTiposInsumos";
import { useTiposEmbalagens, TipoEmbalagem } from "@/hooks/useTiposEmbalagens";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BackButton } from "@/components/BackButton";

type FormData = {
  descricao: string;
  quantidade_embalagem: string;
  unidade_medida_id: string;
};

export default function TiposInsumosEmbalagens() {
  const [tipoAtivo, setTipoAtivo] = useState<"insumos" | "embalagens">("insumos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    quantidade_embalagem: "",
    unidade_medida_id: "",
  });

  const { tiposInsumos, isLoading: loadingInsumos, createTipoInsumo, updateTipoInsumo, deleteTipoInsumo } = useTiposInsumos();
  const { tiposEmbalagens, isLoading: loadingEmbalagens, createTipoEmbalagem, updateTipoEmbalagem, deleteTipoEmbalagem } = useTiposEmbalagens();
  const { unidades: unidadesMedida } = useUnidadesMedida();

  const resetForm = () => {
    setFormData({
      descricao: "",
      quantidade_embalagem: "",
      unidade_medida_id: "",
    });
    setEditandoId(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      descricao: formData.descricao,
      quantidade_embalagem: parseFloat(formData.quantidade_embalagem),
      unidade_medida_id: formData.unidade_medida_id,
    };

    if (tipoAtivo === "insumos") {
      if (editandoId) {
        updateTipoInsumo.mutate({ id: editandoId, ...data }, {
          onSuccess: resetForm,
        });
      } else {
        createTipoInsumo.mutate(data, {
          onSuccess: resetForm,
        });
      }
    } else {
      if (editandoId) {
        updateTipoEmbalagem.mutate({ id: editandoId, ...data }, {
          onSuccess: resetForm,
        });
      } else {
        createTipoEmbalagem.mutate(data, {
          onSuccess: resetForm,
        });
      }
    }
  };

  const handleEdit = (item: TipoInsumo | TipoEmbalagem) => {
    setFormData({
      descricao: item.descricao,
      quantidade_embalagem: item.quantidade_embalagem.toString(),
      unidade_medida_id: item.unidade_medida_id,
    });
    setEditandoId(item.id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (tipoAtivo === "insumos") {
        deleteTipoInsumo.mutate(itemToDelete);
      } else {
        deleteTipoEmbalagem.mutate(itemToDelete);
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const dados = tipoAtivo === "insumos" ? tiposInsumos : tiposEmbalagens;
  const isLoading = tipoAtivo === "insumos" ? loadingInsumos : loadingEmbalagens;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Insumos e Embalagens"
        description="Configure os tipos padrão de insumos e embalagens utilizados"
        actions={<BackButton to="/configuracoes" />}
      />

      <div className="flex gap-2 mb-4">
        <Button
          variant={tipoAtivo === "insumos" ? "default" : "outline"}
          onClick={() => setTipoAtivo("insumos")}
        >
          Insumos
        </Button>
        <Button
          variant={tipoAtivo === "embalagens" ? "default" : "outline"}
          onClick={() => setTipoAtivo("embalagens")}
        >
          Embalagens
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {tipoAtivo === "insumos" ? "Tipos de Insumos" : "Tipos de Embalagens"}
            </CardTitle>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd. Embalagem</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : dados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                dados.map((item) => {
                  const unidade = unidadesMedida.find((u) => u.id === item.unidade_medida_id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>{item.quantidade_embalagem}</TableCell>
                      <TableCell>{unidade?.sigla || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar" : "Novo"}{" "}
              {tipoAtivo === "insumos" ? "Tipo de Insumo" : "Tipo de Embalagem"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade na Embalagem</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={formData.quantidade_embalagem}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade_embalagem: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade de Medida</Label>
                <Select
                  value={formData.unidade_medida_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unidade_medida_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editandoId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
