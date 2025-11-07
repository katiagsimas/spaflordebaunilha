import React from "react";
import { Info, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { useCategoriasEstoque } from "@/hooks/useCategoriasEstoque";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CategoriasEstoque() {
  const { categorias, loading } = useCategoriasEstoque();

  return (
    <div className="space-y-6">
      <PageHeader
        title="📦 Categorias de Estoque"
        description="Categorias fixas e padronizadas para organização profissional"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Categorias Fixas e Padronizadas</AlertTitle>
        <AlertDescription>
          As categorias de estoque são fixas e não podem ser editadas. 
          Isso garante organização consistente e relatórios precisos em todo o sistema.
          Cada categoria possui uma descrição clara do que deve ser cadastrado nela.
        </AlertDescription>
      </Alert>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">#</TableHead>
                  <TableHead className="w-[80px]">Ícone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-center">Permissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: categoria.cor + '60',
                          color: categoria.cor
                        }}
                      >
                        #{categoria.ordem}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ 
                          backgroundColor: categoria.cor + '20',
                          border: `2px solid ${categoria.cor}40`
                        }}
                      >
                        {categoria.icone}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {categoria.nome}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {categoria.descricao}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={categoria.ativo ? "default" : "secondary"}>
                        {categoria.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                          {categoria.editavel ? 'Editável' : 'Bloqueada'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          💡 <strong>Dica:</strong> Use essas categorias ao cadastrar seus itens no catálogo. 
          Isso facilita a geração de relatórios e mantém seu estoque sempre organizado!
        </AlertDescription>
      </Alert>
    </div>
  );
}
