import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Users } from "lucide-react";
import { useFamiliares } from "@/hooks/useFamiliares";

interface FamiliaresListaProps {
  clienteId: string;
  onEdit: (familiar: any) => void;
  onDelete: (id: string) => void;
}

export function FamiliaresLista({ clienteId, onEdit, onDelete }: FamiliaresListaProps) {
  const { familiares, loading } = useFamiliares(clienteId);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingMascote size={48} label="Carregando familiares..." />
      </div>
    );
  }

  if (familiares.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum familiar cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {familiares.map((familiar) => (
        <Card key={familiar.id} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold">{familiar.nome}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {familiar.parentesco && <span>{familiar.parentesco}</span>}
                  {familiar.data_nascimento && (
                    <span>
                      {new Date(familiar.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                {familiar.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1">{familiar.observacoes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(familiar)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(familiar.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
