import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Wallet } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export default function FluxoCaixaHub() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título da Página */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton to="/financeiro" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            Fluxo de Caixa
          </h1>
          <p className="text-muted-foreground">Escolha o tipo de relatório</p>
        </div>
      </div>

      {/* Cards de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Card Fluxo Diário */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-2 border-cda-dourado/60"
          onClick={() => navigate('/financeiro/fluxo-caixa/diario')}
        >
          <CardHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cda-creme text-cda-dourado flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Fluxo Diário
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Movimentações do mês dia a dia
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Card Fluxo Mensal */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-2 border-cda-dourado/60"
          onClick={() => navigate('/financeiro/fluxo-caixa/mensal')}
        >
          <CardHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-cda-creme text-cda-dourado flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Fluxo Mensal
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Visão comparativa mensal completa
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
