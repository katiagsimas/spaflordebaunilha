import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategoriasEstoque } from "@/hooks/useCategoriasEstoque";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CategoriasEstoque() {
  const { categorias, loading } = useCategoriasEstoque();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Estoque"
        description="Visualize as categorias disponíveis para organizar o estoque"
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
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Nenhuma categoria de estoque disponível
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categorias Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categoria.icone}</span>
                        <span className="font-medium">{categoria.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{categoria.descricao}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={categoria.ativo ? "default" : "secondary"}>
                        {categoria.ativo ? "Ativa" : "Inativa"}
                      </Badge>
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
