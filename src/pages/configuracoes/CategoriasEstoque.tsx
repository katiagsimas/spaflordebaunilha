import React from "react";
import { Info, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { useCategoriasEstoque } from "@/hooks/useCategoriasEstoque";

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
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((categoria) => (
            <Card key={categoria.id} className="border-2 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                      style={{ 
                        backgroundColor: categoria.cor + '20',
                        border: `2px solid ${categoria.cor}40`
                      }}
                    >
                      {categoria.icone}
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">
                        {categoria.nome}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs"
                        style={{ 
                          borderColor: categoria.cor + '60',
                          color: categoria.cor
                        }}
                      >
                        #{categoria.ordem}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {categoria.descricao}
                </p>
                
                <div className="pt-3 border-t flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>
                      {categoria.editavel ? 'Editável' : 'Bloqueada'}
                    </span>
                  </div>
                  <Badge variant={categoria.ativo ? "default" : "secondary"} className="text-xs">
                    {categoria.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
