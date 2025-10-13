import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";

interface Banco {
  id: string;
  codigo: string;
  descricao: string;
}

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
  const [bancoJaExiste, setBancoJaExiste] = useState(false);
  const [codigoAutoGerado, setCodigoAutoGerado] = useState(false);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
  });

  const resetForm = () => {
    setFormData({ codigo: "", descricao: "" });
    setEditingBanco(null);
    setBancoJaExiste(false);
    setCodigoAutoGerado(false);
  };

  // Buscar código do banco automaticamente ao digitar o nome
  useEffect(() => {
    if (!formData.descricao || editingBanco) return;

    const nomeDigitado = formData.descricao.toLowerCase().trim();
    
    // Verificar se o banco já existe no sistema
    const bancoExistente = bancos.find(
      b => b.descricao.toLowerCase() === nomeDigitado
    );
    
    if (bancoExistente) {
      setBancoJaExiste(true);
      setCodigoAutoGerado(false);
      return;
    } else {
      setBancoJaExiste(false);
    }

    // Buscar código em bancos conhecidos
    const bancoConhecido = bancosConhecidos.find(
      b => b.nome.toLowerCase().includes(nomeDigitado) || 
           nomeDigitado.includes(b.nome.toLowerCase())
    );

    if (bancoConhecido) {
      setFormData(prev => ({ ...prev, codigo: bancoConhecido.codigo }));
      setCodigoAutoGerado(false);
    } else if (nomeDigitado.length >= 3) {
      // Gerar código automático para banco fictício
      const proximoNumero = bancos.length + 1;
      const codigoGerado = `${String(proximoNumero).padStart(3, '0')}User`;
      setFormData(prev => ({ ...prev, codigo: codigoGerado }));
      setCodigoAutoGerado(true);
    }
  }, [formData.descricao, bancos, editingBanco]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bancoJaExiste && !editingBanco) {
      toast.error("Este banco já existe no sistema!");
      return;
    }
    
    if (editingBanco) {
      setBancos(bancos.map(b => 
        b.id === editingBanco.id 
          ? { ...editingBanco, ...formData }
          : b
      ));
      toast.success("Banco atualizado com sucesso!");
    } else {
      const novoBanco: Banco = {
        id: Date.now().toString(),
        ...formData,
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
                {/* Campo de Descrição/Nome PRIMEIRO */}
                <div className="space-y-2">
                  <Label htmlFor="descricao">Nome do Banco *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                    placeholder="Ex: Banco do Brasil, Nubank, etc"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o nome e o código será preenchido automaticamente
                  </p>
                </div>

                {/* Alertas */}
                {bancoJaExiste && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este banco já existe no sistema!
                    </AlertDescription>
                  </Alert>
                )}

                {codigoAutoGerado && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Código gerado automaticamente (finalizado com "User" para identificar banco personalizado)
                    </AlertDescription>
                  </Alert>
                )}

                {/* Campo de Código SEGUNDO (auto-preenchido) */}
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Banco *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="Ex: 001"
                    className={codigoAutoGerado ? 'bg-secondary' : ''}
                  />
                  {codigoAutoGerado && (
                    <p className="text-xs text-warning">
                      Código gerado automaticamente. Você pode editá-lo se desejar.
                    </p>
                  )}
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

      {bancos.length === 0 ? (
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
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.map((banco) => (
                <TableRow key={banco.id}>
                  <TableCell className="font-medium">{banco.codigo}</TableCell>
                  <TableCell>{banco.descricao}</TableCell>
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
