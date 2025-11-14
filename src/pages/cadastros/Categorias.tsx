import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useCategorias } from "@/hooks/useCategorias";
import { Tag } from "lucide-react";
import { toast } from "sonner";

export default function Categorias() {
  const { categorias, loading, updateCategoria } = useCategorias();

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await updateCategoria(id, { ativo: !ativo });
      toast.success(!ativo ? "Categoria habilitada" : "Categoria desabilitada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar categoria");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Receitas"
        description="Gerencie as categorias de receitas"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">Carregando categorias...</p>
          </CardContent>
        </Card>
      ) : categorias.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">Nenhuma categoria encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {categoria.ativo ? "Habilitada" : "Desabilitada"}
                        </span>
                        <Switch
                          checked={categoria.ativo}
                          onCheckedChange={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                        />
                      </div>
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
