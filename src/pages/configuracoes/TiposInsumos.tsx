import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Box } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';

export default function TiposInsumos() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Ingredientes',
      description: 'Configure os tipos padrão de ingredientes',
      icon: Package,
      path: '/configuracoes/tipos-insumos/ingredientes',
    },
    {
      title: 'Embalagens',
      description: 'Configure os tipos padrão de embalagens',
      icon: Box,
      path: '/configuracoes/tipos-insumos/embalagens',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/configuracoes" />
        <div className="flex-1">
          <PageHeader
            title="Tipos de Insumos e Embalagens"
            description="Configure os tipos padrão de insumos e embalagens utilizados"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(card.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
