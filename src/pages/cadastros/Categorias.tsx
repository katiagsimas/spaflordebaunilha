import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { useCategorias } from "@/hooks/useCategorias";
import { Plus, Power, PowerOff, Tag } from "lucide-react";
import { toast } from "sonner";

const categoriasIniciais = [
  "Bolos",
  "Tortas",
  "Doces Finos",
  "Brigadeiria",
  "Cupcakes",
  "Biscoitos / Cookies",
  "Brownies / Barrinhas",
  "Sobremesas Geladas",
  "Salgados Fritos",
  "Salgados Assados",
  "Bebidas / Xaropes",
  "Recheios",
  "Coberturas",
  "Bases (massas base)",
  "Cremes Técnicos (ganache / chantilly / buttercream)",
  "Decoração (confeitos, toppers feitos à mão, flores comestíveis)",
  "Produção Auxiliar (caldas, caldas de brilho, glaçagem, etc)",
];

export default function Categorias() {
  const navigate = useNavigate();
  
  const { categorias, loading, createCategoria, toggleAtivo } = useCategorias();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'habilitadas' | 'desabilitadas'>('habilitadas');

  const [formData, setFormData] = useState({
    nome: "",
  });

  // Filtrar categorias por status
  const categoriasFiltradas = useMemo(() => {
    if (filtroStatus === 'todas') return categorias;
    if (filtroStatus === 'habilitadas') return categorias.filter(c => c.ativo !== false);
    return categorias.filter(c => c.ativo === false);
  }, [categorias, filtroStatus]);

  // Verificar se deve mostrar o filtro (só mostra se houver categorias desabilitadas)
  const temCategoriasDesabilitadas = categorias.some(c => c.ativo === false);

  // Garantir que as categorias iniciais sejam carregadas se estiver vazio
  useEffect(() => {
    const initializeCategorias = async () => {
      if (!loading && categorias.length === 0) {
        for (const nome of categoriasIniciais) {
          try {
            await createCategoria({ nome });
          } catch (error) {
            console.error('Erro ao criar categoria inicial:', error);
          }
        }
      }
    };
    
    initializeCategorias();
  }, [loading, categorias.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da categoria");
      return;
    }

    try {
      await createCategoria({ nome: formData.nome });
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
    });
    setIsDialogOpen(false);
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await toggleAtivo(id, !ativo);
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status da categoria");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Receitas"
        description="Gerencie as categorias de receitas"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      <div className="flex justify-between items-center">
        {temCategoriasDesabilitadas && (
          <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="habilitadas">Habilitadas</SelectItem>
              <SelectItem value="desabilitadas">Desabilitadas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className={!temCategoriasDesabilitadas ? "ml-auto" : ""}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Bolos, Doces, Salgados, Combos"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categoriasFiltradas.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={filtroStatus === 'desabilitadas' ? "Nenhuma categoria desabilitada" : "Nenhuma categoria cadastrada"}
          description={filtroStatus === 'desabilitadas' ? "Não há categorias desabilitadas no momento" : "Comece criando sua primeira categoria"}
          actionLabel={filtroStatus === 'desabilitadas' ? undefined : "Nova Categoria"}
          onAction={filtroStatus === 'desabilitadas' ? undefined : () => setIsDialogOpen(true)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categorias Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasFiltradas.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={categoria.ativo === false ? "destructive" : "default"}>
                        {categoria.ativo === false ? "Desabilitada" : "Habilitada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(categoria.id, categoria.ativo !== false)}
                      >
                        {categoria.ativo === false ? (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Habilitar
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Desabilitar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
