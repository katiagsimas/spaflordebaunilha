import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBancos } from "@/hooks/useBancos";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Base de dados de bancos brasileiros conhecidos
const bancosConhecidos = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "033", nome: "Santander" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "341", nome: "Itaú Unibanco" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "077", nome: "Banco Inter" },
  { codigo: "290", nome: "PagSeguro" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "323", nome: "Mercado Pago" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "422", nome: "Banco Safra" },
  { codigo: "389", nome: "Banco Mercantil do Brasil" },
  { codigo: "756", nome: "Bancoob" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "136", nome: "Unicred" },
  { codigo: "655", nome: "Neon" },
  { codigo: "637", nome: "Sofisa" },
  { codigo: "340", nome: "Super Pagamentos" },
  { codigo: "380", nome: "PicPay" },
];


export default function Bancos() {
  const { bancos, loading, createBanco, updateBanco } = useBancos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<any | null>(null);
  const [bancoJaExiste, setBancoJaExiste] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Conta Corrente",
    saldo_inicial: 0,
  });

  const resetForm = () => {
    setFormData({ nome: "", tipo: "Conta Corrente", saldo_inicial: 0 });
    setEditingBanco(null);
    setBancoJaExiste(false);
  };

  // Verificar se o banco já existe
  useEffect(() => {
    if (!formData.nome || editingBanco) return;

    const nomeDigitado = formData.nome.toLowerCase().trim();
    
    const bancoExistente = bancos.find(
      b => b.nome.toLowerCase() === nomeDigitado
    );
    
    setBancoJaExiste(!!bancoExistente);
  }, [formData.nome, bancos, editingBanco]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bancoJaExiste && !editingBanco) {
      toast.error("Este banco já existe no sistema!");
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
      toast.error(error.message);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <BackButton to="/configuracoes" />
      </div>
      
      <PageHeader
        title="Bancos"
        description="Gerencie as instituições bancárias utilizadas"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Banco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBanco ? "Editar Banco" : "Novo Banco"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Banco *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="Ex: Nubank, Caixa Empresa, etc"
                    autoFocus
                  />
                </div>

                {bancoJaExiste && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este banco já existe no sistema!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conta *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                      <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                      <SelectItem value="Carteira Digital">Carteira Digital</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldo_inicial">Saldo Inicial (R$)</Label>
                  <Input
                    id="saldo_inicial"
                    type="number"
                    step="0.01"
                    value={formData.saldo_inicial}
                    onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={bancoJaExiste && !editingBanco}>
                    Salvar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : bancos.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum banco cadastrado"
          description="Comece criando seu primeiro banco"
          actionLabel="Novo Banco"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Saldo Inicial</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.map((banco) => (
                <TableRow key={banco.id}>
                  <TableCell className="font-medium">{banco.nome}</TableCell>
                  <TableCell>{banco.tipo}</TableCell>
                  <TableCell>R$ {banco.saldo_inicial.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(banco)}
                      title="Editar banco"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
