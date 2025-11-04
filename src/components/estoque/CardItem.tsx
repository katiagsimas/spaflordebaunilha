import { useState } from "react";
import { Package, DollarSign, MoreVertical, TrendingUp, Settings } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeStatus } from "./BadgeStatus";
import type { ItemComEstoque } from "@/types/estoque";

interface CardItemProps {
  item: ItemComEstoque;
  onEntrada: (item: ItemComEstoque) => void;
  onEditar: (item: ItemComEstoque) => void;
  onAtivarRastreio: (item: ItemComEstoque) => void;
}

export function CardItem({ item, onEntrada, onEditar, onAtivarRastreio }: CardItemProps) {
  const formatarValor = (valor?: number) => {
    if (!valor) return 'R$ -';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarQuantidade = (qtd?: number, unidade?: string) => {
    if (qtd === undefined) return '-';
    return `${qtd.toFixed(2)} ${unidade || ''}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">{item.nome}</CardTitle>
            {item.categoria && (
              <Badge variant="outline" className="mt-1 text-xs">
                {item.categoria}
              </Badge>
            )}
          </div>
          <BadgeStatus status={item.status || 'sem_rastreio'} saldo={item.estoque?.saldo} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Estoque */}
        {item.rastrear_estoque && item.estoque && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Estoque</span>
            </div>
            <div className="font-semibold font-mono">
              {formatarQuantidade(item.estoque.saldo, item.unidade_base)}
            </div>
          </div>
        )}

        {/* Preço */}
        {item.preco_ativo && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Custo</span>
            </div>
            <div className="text-right">
              <div className="font-semibold font-mono">
                {formatarValor(item.preco_ativo.custo_unitario)}/{item.unidade_base}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.preco_ativo.marca}
              </div>
            </div>
          </div>
        )}

        {/* Valor do Estoque */}
        {item.rastrear_estoque && item.estoque && item.estoque.valor_estoque > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Valor total</span>
            </div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatarValor(item.estoque.valor_estoque)}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t">
        {item.rastrear_estoque ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEntrada(item)}
            >
              ➕ Entrada
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEditar(item)}
            >
              <Settings className="mr-1 h-3 w-3" />
              Editar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAtivarRastreio(item)}
            >
              🎯 Ativar Rastreio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditar(item)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
