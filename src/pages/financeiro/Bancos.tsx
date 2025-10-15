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
import { EmptyState } from "@/components/EmptyState";

interface Banco {
  id: string;
  codigo: string;
  descricao: string;
}

const bancosIniciais: Banco[] = [
  { id: "0", codigo: "000", descricao: "Caixa Empresa" },
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
  const [editingBanco, setEditingBanco] = useState<Banco | null>(null);
  
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
    
    if (!formData.descricao.trim()) {
      toast.error("Digite a descrição do banco");
      return;
    }

    if (!formData.codigo.trim()) {
      toast.error("Digite o código do banco");
      return;
    }

    if (editingBanco) {
      setBancos(bancos.map(b => 
        b.id === editingBanco.id 
          ? { ...b, codigo: formData.codigo.trim(), descricao: formData.descricao.trim() }
          : b
      ));
      toast.success("Banco atualizado!");
    } else {
      const novoBanco: Banco = {
        id: crypto.randomUUID(),
        codigo: formData.codigo.trim(),
        descricao: formData.descricao.trim(),
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

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este banco?")) {
      setBancos(bancos.filter(b => b.id !== id));
      toast.success("Banco deletado!");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <BackButton to="/configuracoes" />
      
      <PageHeader
        title="Bancos"
        description="Gerencie as instituições bancárias utilizadas"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#D89B8C] hover:bg-[#B87C6D] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Banco
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-[#6B5047]">
                  {editingBanco ? 'Editar Banco' : 'Novo Banco'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="codigo" className="text-[#6B5047]">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: 001, 033, 260..."
                    required
                    maxLength={10}
                  />
                  <p className="text-xs text-[#9C8B82] mt-1">
                    Digite o código da instituição bancária
                  </p>
                </div>

                <div>
                  <Label htmlFor="descricao" className="text-[#6B5047]">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Banco do Brasil, Nubank, Caixa..."
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-[#9C8B82] mt-1">
                    Digite o nome da instituição bancária
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#D89B8C] hover:bg-[#B87C6D] text-white"
                  >
                    {editingBanco ? 'Atualizar' : 'Criar'}
                  </Button>
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
          description="Comece adicionando as instituições bancárias que você utiliza"
          actionLabel="Adicionar primeiro banco"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-[#E8E3DF] shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAF8F6] hover:bg-[#FAF8F6]">
                <TableHead className="text-[#6B5047] font-semibold">Código</TableHead>
                <TableHead className="text-[#6B5047] font-semibold">Descrição</TableHead>
                <TableHead className="text-[#6B5047] font-semibold text-center w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.map((banco) => (
                <TableRow key={banco.id} className="hover:bg-[#FAF8F6]/50">
                  <TableCell className="font-medium text-[#6B5047]">{banco.codigo}</TableCell>
                  <TableCell className="text-[#9C8B82]">{banco.descricao}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(banco)}
                        className="text-[#D89B8C] hover:text-[#B87C6D] hover:bg-[#D89B8C]/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(banco.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}
