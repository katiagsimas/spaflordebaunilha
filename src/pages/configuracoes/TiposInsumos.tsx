import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import TiposInsumosIngredientes from '@/components/TiposInsumos/Ingredientes';
import TiposInsumosEmbalagens from '@/components/TiposInsumos/Embalagens';
import TiposInsumosOutros from '@/components/TiposInsumos/Outros';

export default function TiposInsumos() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Insumos e Embalagens"
        description="Cadastre os tipos base de ingredientes, embalagens e outros insumos"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      <Tabs defaultValue="ingredientes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
          <TabsTrigger value="embalagens">Embalagens</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredientes">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Ingredientes</CardTitle>
              <CardDescription>
                Cadastre os tipos base de ingredientes (ex: Farinha de Trigo 1kg, Açúcar 5kg)
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
