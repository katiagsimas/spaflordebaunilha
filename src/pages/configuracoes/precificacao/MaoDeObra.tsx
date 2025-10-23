import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Clock, Plus, Pencil, Trash2, Star, ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMaoObra, type MaoDeObra } from "@/hooks/useMaoObra";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";

const coresDisponiveis = [
  { value: "blue", label: "Azul", class: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300" },
  { value: "purple", label: "Roxo", class: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300" },
  { value: "pink", label: "Rosa", class: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300" },
  { value: "green", label: "Verde", class: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300" },
  { value: "amber", label: "Âmbar", class: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300" },
  { value: "red", label: "Vermelho", class: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300" },
];

export default function MaoDeObra() {
  const navigate = useNavigate();
  const { valores, isLoading, createMaoObra, updateMaoObra, deleteMaoObra } = useMaoObra();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<MaoDeObra | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    valor_hora: "",
    descricao: "",
    cor: "blue",
    ativo: true,
    padrao: false,
  });

  const handleSubmit = async () => {
    if (!formData.nome || !formData.valor_hora) {
      return;
    }

    const data = {
      nome: formData.nome,
      valor_hora: parseFloat(formData.valor_hora),
      descricao: formData.descricao || undefined,
      cor: formData.cor,
      ativo: formData.ativo,
      padrao: formData.padrao,
    };

    if (editando) {
      updateMaoObra({ id: editando.id, ...data });
    } else {
      createMaoObra(data);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (valor: MaoDeObra) => {
    setEditando(valor);
    setFormData({
      nome: valor.nome,
      valor_hora: valor.valor_hora.toString(),
      descricao: valor.descricao || "",
      cor: valor.cor,
      ativo: valor.ativo,
      padrao: valor.padrao,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    deleteMaoObra(id);
    setDeleteDialog(null);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      valor_hora: "",
      descricao: "",
      cor: "blue",
      ativo: true,
      padrao: false,
    });
    setEditando(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <PageHeader
          title="Valores de Mão de Obra"
          description="Carregando..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <PageHeader
        title="Valores de Mão de Obra"
        description="Defina quanto vale sua hora de trabalho"
        backButton={<BackButton to="/configuracoes/precificacao" />}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Valor
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar" : "Novo"} Valor de Mão de Obra</DialogTitle>
            <DialogDescription>
              Configure um valor por hora para usar nas suas receitas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Padrão, Decoração, Express"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor por Hora (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="20.00"
                value={formData.valor_hora}
                onChange={(e) => setFormData({ ...formData, valor_hora: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Para que tipo de trabalho é esse valor?"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="grid grid-cols-6 gap-2">
                {coresDisponiveis.map((cor) => (
                  <button
                    key={cor.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: cor.value })}
                    className={`
                      w-full h-12 rounded-lg transition-all
                      ${cor.class}
                      ${formData.cor === cor.value ? "ring-2 ring-primary scale-110" : "opacity-50 hover:opacity-100"}
                    `}
                    title={cor.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="padrao" className="cursor-pointer">
                    Definir como padrão
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Será selecionado automaticamente em novas receitas
                  </p>
                </div>
              </div>
              <Switch
                id="padrao"
                checked={formData.padrao}
                onCheckedChange={(checked) => setFormData({ ...formData, padrao: checked })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => handleDialogClose(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              {editando ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 Como funciona?</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Configure diferentes valores para tipos de trabalho</li>
                  <li>• Ao criar uma receita, selecione o tipo de mão de obra</li>
                  <li>• O sistema calcula automaticamente: Tempo × Valor/hora</li>
                  <li>• O custo é incluído no CMV da receita</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {valores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum valor cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Cadastre seu primeiro valor de mão de obra para começar
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Valor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {valores.map((valor) => {
            const corClass = coresDisponiveis.find(c => c.value === valor.cor)?.class || "bg-blue-100 text-blue-600";
            
            return (
              <Card key={valor.id} className="group relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                {valor.padrao && (
                  <div className="absolute -top-2 -right-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </div>
                )}
                <CardHeader className="p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${corClass} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                        {valor.nome}
                      </CardTitle>
                      {valor.padrao && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs shrink-0">
                          Padrão
                        </Badge>
                      )}
                      {!valor.ativo && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 text-xs shrink-0">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    {valor.descricao || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Valor/hora:
                      </span>
                      <span className="text-lg font-bold">
                        R$ {valor.valor_hora.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(valor)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDialog(valor.id)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir valor de mão de obra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Receitas que usam este valor continuarão
              com o custo calculado, mas você não poderá selecionar este valor em novas receitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
