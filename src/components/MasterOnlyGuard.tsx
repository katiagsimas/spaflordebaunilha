import { Crown, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsGroupMaster } from '@/hooks/useIsGroupMaster';

interface MasterOnlyGuardProps {
  /** Nome amigável do recurso, ex: "dados da confeitaria" */
  recurso: string;
  children: React.ReactNode;
}

/**
 * Exibe um cartão informativo quando o usuário não é o mestre do grupo ativo,
 * indicando que aquele recurso é gerenciado pelo mestre. Caso seja mestre (ou
 * MOTHER), renderiza normalmente os filhos.
 */
export function MasterOnlyGuard({ recurso, children }: MasterOnlyGuardProps) {
  const { isMaster, masterEmail, masterName, isLoading } = useIsGroupMaster();
  if (isLoading) return null;
  if (isMaster) return <>{children}</>;

  const quem = masterName ? `${masterName} (${masterEmail || '—'})` : (masterEmail || 'o mestre do grupo');

  return (
    <Card className="border-cda-dourado/40 bg-cda-dourado/10">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="rounded-full bg-cda-dourado/20 p-3 shrink-0">
          <Crown className="h-6 w-6 text-cda-dourado" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-cda-vinho" />
            <p className="font-semibold text-cda-preto">Gerenciado pelo mestre do grupo</p>
          </div>
          <p className="text-sm text-cda-preto/80">
            Os <strong>{recurso}</strong> deste grupo são configurados por <strong>{quem}</strong>.
            Você acessa as informações já cadastradas, mas só o mestre pode alterá-las.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
