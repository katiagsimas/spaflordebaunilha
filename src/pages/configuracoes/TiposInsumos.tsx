import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';
import TiposInsumosIngredientes from '@/components/TiposInsumos/Ingredientes';
import TiposInsumosEmbalagens from '@/components/TiposInsumos/Embalagens';
import TiposInsumosOutros from '@/components/TiposInsumos/Outros';
import { consumeSystemAccess } from '@/lib/systemAccess';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useGroup } from '@/contexts/GroupContext';

/**
 * Tela INTERNA do sistema — uso exclusivo.
 *
 * Esta página gerencia os tipos base de Insumos e Embalagens diretamente
 * no banco de dados. Não é exibida em menus nem em cards do usuário.
 *
 * Regras de acesso:
 *  1. É obrigatório um token one-shot concedido por outra parte do sistema
 *     via `grantSystemAccess('tipos-insumos')` ANTES da navegação.
 *  2. Adicionalmente, o usuário precisa ser ADMIN ou MOTHER.
 *  3. Acesso direto pela URL (sem token) é bloqueado e redireciona para
 *     /configuracoes/cadastros-base.
 */
export default function TiposInsumos() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isMother } = useGroup();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Aguarda o carregamento da role antes de decidir
    if (loadingAdmin) return;

    const hasSystemToken = consumeSystemAccess('tipos-insumos');
    const hasRole = isAdmin || isMother;

    if (!hasSystemToken || !hasRole) {
      toast.error('Acesso restrito', {
        description: 'Esta área é de uso interno do sistema.',
      });
      navigate('/cadastros', { replace: true });
      return;
    }

    setAuthorized(true);
  }, [loadingAdmin, isAdmin, isMother, navigate]);

  if (authorized !== true) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insumos e Embalagens"
        description="Área interna do sistema — gerenciamento dos tipos base"
        backButton={<BackButton to="/cadastros" />}
      />

      <Tabs defaultValue="ingredientes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ingredientes">Insumos</TabsTrigger>
          <TabsTrigger value="embalagens">Embalagens</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredientes">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Insumos</CardTitle>
              <CardDescription>
                Cadastre os tipos base de insumos (ex: Farinha de Trigo 1kg, Açúcar 5kg)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TiposInsumosIngredientes />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embalagens">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Embalagens</CardTitle>
              <CardDescription>
                Cadastre os tipos base de embalagens (ex: Caixa de Papelão 1 unidade)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TiposInsumosEmbalagens />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outros">
          <Card>
            <CardHeader>
              <CardTitle>Outros Insumos</CardTitle>
              <CardDescription>
                Cadastre outros tipos de insumos (ex: Papel Toalha 1 rolo, Saco de Lixo 100un)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TiposInsumosOutros />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
