import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Trash2, Download } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Bancos() {
  const { bancos, loading, createBanco, updateBanco, deleteBanco } = useBancos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<any | null>(null);
  const [bancoToDelete, setBancoToDelete] = useState<any | null>(null);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "corrente",
    saldo_inicial: 0,
  });

  // Verificar se há dados no localStorage ao carregar
  useEffect(() => {
    const checkLocalStorage = () => {
      const sugarboxBancos = localStorage.getItem("sugarbox_bancos");
      const bancosSimples = localStorage.getItem("bancos");
      
      if (sugarboxBancos || bancosSimples) {
        try {
          const data = JSON.parse(sugarboxBancos || bancosSimples || "[]");
          setHasLocalStorageData(Array.isArray(data) && data.length > 0);
        } catch {
          setHasLocalStorageData(false);
        }
      }
    };
    
    checkLocalStorage();
  }, []);

  const importFromLocalStorage = async () => {
    const sugarboxBancos = localStorage.getItem("sugarbox_bancos");
    const bancosSimples = localStorage.getItem("bancos");
    const rawData = sugarboxBancos || bancosSimples;
    
    if (!rawData) {
      toast.error("Nenhum dado encontrado no localStorage");
      return;
    }

    try {
      const data = JSON.parse(rawData);
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("Dados inválidos no localStorage");
        return;
      }

      let importedCount = 0;
      let errorCount = 0;

      for (const banco of data) {
        try {
          await createBanco({
            nome: banco.nome || banco.descricao,
            tipo: banco.tipo || "corrente",
            saldo_inicial: Number(banco.saldo_inicial || 0),
          });
          importedCount++;
        } catch (error) {
          console.error("Erro ao importar banco:", banco, error);
          errorCount++;
        }
      }

      if (importedCount > 0) {
        toast.success(`${importedCount} banco(s) importado(s) com sucesso!`);
        setHasLocalStorageData(false);
        // Limpar localStorage após importação bem-sucedida
        localStorage.removeItem("sugarbox_bancos");
        localStorage.removeItem("bancos");
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} banco(s) não puderam ser importados`);
      }
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      toast.error("Erro ao importar dados do localStorage");
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", tipo: "corrente", saldo_inicial: 0 });
    setEditingBanco(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome do banco");
      return;
    }

    try {
      if (editingBanco) {
        await updateBanco(editingBanco.id, formData);
      } else {
        await createBanco(formData);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar banco");
    }
  };

  const handleEdit = (banco: any) => {
    setEditingBanco(banco);
    setFormData({
      nome: banco.nome,
      tipo: banco.tipo,
      saldo_inicial: banco.saldo_inicial,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (banco: any) => {
    setBancoToDelete(banco);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bancoToDelete) return;
    
    try {
      await deleteBanco(bancoToDelete.id);
      setDeleteDialogOpen(false);
      setBancoToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir banco");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/configuracoes" />
        <div className="flex-1">
          <PageHeader
            title="Bancos"
            description="Gerencie suas contas bancárias"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-[#9C8B82]">
          {bancos.length} {bancos.length === 1 ? 'banco cadastrado' : 'bancos cadastrados'}
        </p>
        <div className="flex gap-2">
          {hasLocalStorageData && bancos.length === 0 && (
            <Button
              onClick={importFromLocalStorage}
              variant="outline"
              className="border-[#D89B8C] text-[#D89B8C] hover:bg-[#FEF3E2]"
            >
              <Download className="mr-2 h-4 w-4" />
              Recuperar Dados Salvos
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-[#D89B8C] hover:bg-[#B87C6D] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Banco
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-[#6B5047]">
                {editingBanco ? "Editar Banco" : "Novo Banco"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome" className="text-[#6B5047]">Nome do Banco *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Banco do Brasil"
                  className="border-[#E8E3DF] focus:border-[#D89B8C]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo" className="text-[#6B5047]">Tipo de Conta *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger className="border-[#E8E3DF] focus:border-[#D89B8C]">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    <SelectItem value="investimento">Conta Investimento</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="saldo_inicial" className="text-[#6B5047]">Saldo Inicial</Label>
                <Input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  value={formData.saldo_inicial}
                  onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                  placeholder="R$ 0,00"
                  className="border-[#E8E3DF] focus:border-[#D89B8C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  className="border-[#E8E3DF]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#D89B8C] hover:bg-[#B87C6D] text-white"
                >
                  {editingBanco ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {bancos.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum banco cadastrado"
          description="Comece criando seu primeiro banco para gerenciar suas contas."
        />
      ) : (
        <div className="bg-white rounded-lg border border-[#E8E3DF] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAF7F5] hover:bg-[#FAF7F5]">
                <TableHead className="text-[#6B5047] font-semibold">Nome</TableHead>
                <TableHead className="text-[#6B5047] font-semibold">Tipo</TableHead>
                <TableHead className="text-[#6B5047] font-semibold">Saldo Inicial</TableHead>
                <TableHead className="text-[#6B5047] font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.map((banco) => (
                <TableRow key={banco.id} className="hover:bg-[#FAF7F5]">
                  <TableCell className="font-medium text-[#6B5047]">{banco.nome}</TableCell>
                  <TableCell className="text-[#9C8B82] capitalize">{banco.tipo}</TableCell>
                  <TableCell className="text-[#9C8B82]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(banco.saldo_inicial)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(banco)}
                        className="text-[#D89B8C] hover:text-[#B87C6D] hover:bg-[#FEF3E2]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(banco)}
                        className="text-[#D88B8B] hover:text-[#B87C6D] hover:bg-[#FFEBEE]"
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Banco"
        description={`Tem certeza que deseja excluir o banco "${bancoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
