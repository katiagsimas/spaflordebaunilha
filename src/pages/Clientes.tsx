import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { Trash2, Phone, Calendar, User } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  aniversario: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useLocalStorage<Cliente[]>("clientes", []);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aniversario, setAniversario] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !telefone) {
      toast.error("Por favor, preencha nome e telefone");
      return;
    }

    const novoCliente: Cliente = {
      id: crypto.randomUUID(),
      nome,
      telefone,
      aniversario,
    };

    setClientes([...clientes, novoCliente]);
    setNome("");
    setTelefone("");
    setAniversario("");
    toast.success("Cliente cadastrado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
    setDeleteId(null);
    toast.success("Cliente removido com sucesso!");
  };

  const formatarTelefone = (tel: string) => {
    const numeros = tel.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    }
    return tel;
  };

  const formatarData = (data: string) => {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clientes" 
        description="Gerencie seus clientes e mantenha contato"
      />

      <Card>
        <CardHeader>
          <CardTitle>Novo Cliente</CardTitle>
          <CardDescription>Cadastre um novo cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aniversario">Data de Aniversário</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="aniversario"
                    type="date"
                    value={aniversario}
                    onChange={(e) => setAniversario(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Cadastrar Cliente
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
          <CardDescription>
            {clientes.length === 0 
              ? "Nenhum cliente cadastrado ainda" 
              : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} cadastrado${clientes.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <EmptyState
              icon={User}
              title="Nenhum cliente cadastrado"
              description="Cadastre seu primeiro cliente usando o formulário acima"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone/WhatsApp</TableHead>
                    <TableHead>Aniversário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{formatarTelefone(cliente.telefone)}</TableCell>
                      <TableCell>{formatarData(cliente.aniversario)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(cliente.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Remover Cliente"
        description="Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
