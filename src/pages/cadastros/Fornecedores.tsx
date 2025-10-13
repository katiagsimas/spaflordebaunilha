import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Pencil, Trash2, Truck, ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Fornecedor {
  id: string;
  nome: string;
  tipo: "PF" | "PJ";
  cpfCnpj: string;
  telefone: string;
  email: string;
  contato: string;
  observacoes: string;
}

export default function Fornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useLocalStorage<Fornecedor[]>("fornecedores", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF" as "PF" | "PJ",
    cpfCnpj: "",
    telefone: "",
    email: "",
    contato: "",
    observacoes: "",
  });

  useEffect(() => {
    if (editingFornecedor) {
      setFormData(editingFornecedor);
      setIsDialogOpen(true);
    }
  }, [editingFornecedor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingFornecedor) {
      setFornecedores(fornecedores.map(f => f.id === editingFornecedor.id ? { ...formData, id: f.id } : f));
      toast.success("Fornecedor atualizado com sucesso!");
    } else {
      const newFornecedor: Fornecedor = {
        ...formData,
        id: Date.now().toString(),
      };
      setFornecedores([...fornecedores, newFornecedor]);
      toast.success("Fornecedor cadastrado com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "PF",
      cpfCnpj: "",
      telefone: "",
      email: "",
      contato: "",
      observacoes: "",
    });
    setEditingFornecedor(null);
    setIsDialogOpen(false);
    setObservacoesOpen(false);
  };

  const handleDelete = (id: string) => {
    setFornecedores(fornecedores.filter(f => f.id !== id));
    setDeleteId(null);
    toast.success("Fornecedor excluído com sucesso!");
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/cadastros")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title="Fornecedores"
            description="Gerencie seus fornecedores"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Fornecedores</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingFornecedor(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="tipo">PF ou PJ</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: "PF" | "PJ") => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CNPJ/CPF</Label>
                    <Input
                      id="cpfCnpj"
                      value={formData.cpfCnpj}
                      onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contato">Contato</Label>
                    <Input
                      id="contato"
                      value={formData.contato}
                      onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                      placeholder="Nome do contato"
                    />
                  </div>
                </div>

                <Collapsible open={observacoesOpen} onOpenChange={setObservacoesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Observações
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Digite aqui observações sobre o fornecedor..."
                      rows={4}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingFornecedor ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {fornecedores.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nenhum fornecedor cadastrado"
              description="Comece adicionando seu primeiro fornecedor"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.tipo}</TableCell>
                      <TableCell>{fornecedor.cpfCnpj || "-"}</TableCell>
                      <TableCell>{fornecedor.telefone}</TableCell>
                      <TableCell>{fornecedor.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(fornecedor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(fornecedor.id)}
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
        title="Excluir Fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
