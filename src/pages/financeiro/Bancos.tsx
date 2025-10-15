import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBancos } from "@/hooks/useBancos";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

export default function Bancos() {
  const { bancos, loading, createBanco, updateBanco, deleteBanco } = useBancos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Conta Corrente",
    saldo_inicial: "0,00",
  });

  const resetForm = () => {
    setFormData({ nome: "", tipo: "Conta Corrente", saldo_inicial: "0,00" });
    setEditingBanco(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Digite o nome do banco");
      return;
    }

    try {
      const saldoInicial = parseFloat(formData.saldo_inicial.replace(/[^\d,]/g, '').replace(',', '.'));
      
      if (editingBanco) {
        await updateBanco(editingBanco.id, {
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          saldo_inicial: saldoInicial,
        });
      } else {
        await createBanco({
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          saldo_inicial: saldoInicial,
        });
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (banco: any) => {
    setEditingBanco(banco);
    setFormData({
      nome: banco.nome,
      tipo: banco.tipo,
      saldo_inicial: banco.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este banco?")) {
      try {
        await deleteBanco(id);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 0) {
      setFormData({ ...formData, saldo_inicial: '0,00' });
      return;
    }
    const numValue = parseInt(value) / 100;
    setFormData({ ...formData, saldo_inicial: numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
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
                  <Label htmlFor="nome" className="text-[#6B5047]">Nome do Banco *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Banco do Brasil, Nubank, Caixa..."
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-[#9C8B82] mt-1">
                    Digite o nome da instituição bancária
                  </p>
                </div>

                <div>
                  <Label htmlFor="tipo" className="text-[#6B5047]">Tipo de Conta *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                      <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                      <SelectItem value="Conta Salário">Conta Salário</SelectItem>
                      <SelectItem value="Carteira Digital">Carteira Digital</SelectItem>
                      <SelectItem value="Investimento">Investimento</SelectItem>
                      <SelectItem value="Caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="saldo_inicial" className="text-[#6B5047]">Saldo Inicial</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8B82]">R$</span>
                    <Input
                      id="saldo_inicial"
                      value={formData.saldo_inicial}
                      onChange={handleSaldoChange}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-[#9C8B82] mt-1">
                    Informe o saldo inicial desta conta
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

      {loading ? (
        <div className="text-center py-8 text-[#9C8B82]">Carregando...</div>
      ) : bancos.length === 0 ? (
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
                <TableHead className="text-[#6B5047] font-semibold">Nome</TableHead>
                <TableHead className="text-[#6B5047] font-semibold">Tipo</TableHead>
                <TableHead className="text-[#6B5047] font-semibold text-right">Saldo Inicial</TableHead>
                <TableHead className="text-[#6B5047] font-semibold text-center w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.map((banco) => (
                <TableRow key={banco.id} className="hover:bg-[#FAF8F6]/50">
                  <TableCell className="font-medium text-[#6B5047]">{banco.nome}</TableCell>
                  <TableCell className="text-[#9C8B82]">{banco.tipo}</TableCell>
                  <TableCell className="text-right text-[#6B5047]">
                    R$ {banco.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
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
