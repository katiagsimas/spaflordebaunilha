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
import { useViaCEP } from "@/hooks/useViaCEP";
import { Plus, Pencil, Trash2, Users, ArrowLeft, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Cliente {
  id: string;
  nome: string;
  tipo: "PF" | "PJ";
  aniversario: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cpf: string;
  instagram: string;
  observacoes: string;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useLocalStorage<Cliente[]>("clientes", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const { buscarCEP, loading } = useViaCEP();

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF" as "PF" | "PJ",
    aniversario: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cpf: "",
    instagram: "",
    observacoes: "",
  });

  useEffect(() => {
    if (editingCliente) {
      setFormData(editingCliente);
      setIsDialogOpen(true);
    }
  }, [editingCliente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error("Nome e telefone são obrigatórios!");
      return;
    }

    if (editingCliente) {
      setClientes(clientes.map(c => c.id === editingCliente.id ? { ...formData, id: c.id } : c));
      toast.success("Cliente atualizado com sucesso!");
    } else {
      const newCliente: Cliente = {
        ...formData,
        id: Date.now().toString(),
      };
      setClientes([...clientes, newCliente]);
      toast.success("Cliente cadastrado com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "PF",
      aniversario: "",
      telefone: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cpf: "",
      instagram: "",
      observacoes: "",
    });
    setEditingCliente(null);
    setIsDialogOpen(false);
    setObservacoesOpen(false);
  };

  const handleBuscarCEP = async () => {
    const endereco = await buscarCEP(formData.cep);
    if (endereco) {
      setFormData({
        ...formData,
        endereco: endereco.endereco,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
      });
    }
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
    setDeleteId(null);
    toast.success("Cliente excluído com sucesso!");
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
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
            title="Clientes"
            description="Gerencie seus clientes"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Clientes</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCliente(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
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
                    <Label htmlFor="aniversario">Data de Aniversário</Label>
                    <Input
                      id="aniversario"
                      type="date"
                      value={formData.aniversario}
                      onChange={(e) => setFormData({ ...formData, aniversario: e.target.value })}
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
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBuscarCEP}
                        disabled={loading || !formData.cep}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {loading ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, Avenida"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Apto, Bloco, etc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram (@)</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@usuario"
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
                      placeholder="Digite aqui observações sobre o cliente..."
                      rows={4}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCliente ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente cadastrado"
              description="Comece adicionando seu primeiro cliente"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.tipo}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.cpf || "-"}</TableCell>
                      <TableCell>{cliente.instagram || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(cliente.id)}
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
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
