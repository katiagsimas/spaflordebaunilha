import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";
import { useCategorias } from "@/hooks/useCategorias";
import { Power, PowerOff, Tag, Lock } from "lucide-react";
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
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'habilitadas' | 'desabilitadas'>('habilitadas');

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
        title="📦 Categorias de Receitas"
        description="Categorias fixas para organização profissional"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Categorias Fixas - Apenas Visualização</AlertTitle>
        <AlertDescription>
          As categorias de receitas são fixas e não podem ser criadas ou excluídas. 
          Você pode apenas habilitar ou desabilitar categorias conforme sua necessidade.
          Isso garante organização consistente em todo o sistema.
        </AlertDescription>
      </Alert>

      {temCategoriasDesabilitadas && (
        <div className="flex justify-start">
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
        </div>
      )}

      {categoriasFiltradas.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={filtroStatus === 'desabilitadas' ? "Nenhuma categoria desabilitada" : "Nenhuma categoria cadastrada"}
          description={filtroStatus === 'desabilitadas' ? "Não há categorias desabilitadas no momento" : "As categorias padrão serão carregadas automaticamente"}
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
