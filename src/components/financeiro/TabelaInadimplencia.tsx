import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Building2 } from 'lucide-react';
import type { InadimplenciaItem } from '@/hooks/useResumoDashboard';

interface TabelaInadimplenciaProps {
  tipo: 'clientes' | 'fornecedores';
  itens: InadimplenciaItem[];
}

function getCorPorDiasAtraso(dias: number) {
  if (dias > 30) return 'bg-cda-coral text-white';
  if (dias > 15) return 'bg-warning text-white';
  return 'bg-warning text-white';
}

export function TabelaInadimplencia({ tipo, itens }: TabelaInadimplenciaProps) {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const ehClientes = tipo === 'clientes';
  const Icon = ehClientes ? Users : Building2;
  const cor = ehClientes
    ? {
        border: 'border-l-red-500',
        iconBg: 'bg-cda-coral/10 dark:bg-cda-coral/20',
        iconText: 'text-cda-coral dark:text-cda-coral',
        totalText: 'text-cda-coral dark:text-cda-coral',
      }
    : {
        border: 'border-l-orange-500',
        iconBg: 'bg-warning/10 dark:bg-warning/20',
        iconText: 'text-warning dark:text-warning',
        totalText: 'text-warning dark:text-warning',
      };

  const titulo = ehClientes ? 'Inadimplência - Clientes' : 'Inadimplência - Fornecedores';
  const entidade = ehClientes ? 'cliente' : 'fornecedor';
  const entidadePlural = ehClientes ? 'clientes' : 'fornecedores';
  const descricaoQtd = ehClientes
    ? `${itens.length} cliente(s) inadimplente(s)`
    : `${itens.length} fornecedor(es) inadimplente(s)`;
  const headerCol = ehClientes ? 'Cliente' : 'Fornecedor';
  const vazioMsg = ehClientes
    ? 'Nenhum cliente inadimplente 🎉'
    : 'Nenhum fornecedor inadimplente 🎉';

  const total = itens.reduce((sum, i) => sum + i.valor, 0);
  const itensExibir = mostrarTodos ? itens : itens.slice(0, 10);

  return (
    <Card className={`border-l-4 ${cor.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${cor.iconBg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${cor.iconText}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
              <CardDescription className="text-sm">{descricaoQtd}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${cor.totalText}`}>
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Total em atraso</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
            <p className="font-medium">{vazioMsg}</p>
            <p className="text-sm mt-1">Todas as contas estão em dia</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{headerCol}</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensExibir.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {index + 1}. {item.nome}
                        </p>
                        {item.telefone && (
                          <p className="text-xs text-muted-foreground">{item.telefone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getCorPorDiasAtraso(item.dias_atraso)}>
                        {item.dias_atraso} dias
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {itens.length > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setMostrarTodos(!mostrarTodos)}>
                  {mostrarTodos
                    ? 'Mostrar apenas TOP 10'
                    : `Ver todos os ${itens.length} ${entidadePlural}`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
