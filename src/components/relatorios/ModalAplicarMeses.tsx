import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModalAplicarMesesProps {
  aberto: boolean;
  onFechar: () => void;
  valoresBase: {
    custos_fixos: number;
    cmv_percentual: number;
    ticket_medio: number;
  };
  mesOrigem: { ano: number; mes: number };
  onSucesso?: () => void;
}

export function ModalAplicarMeses({
  aberto,
  onFechar,
  valoresBase,
  mesOrigem,
  onSucesso
}: ModalAplicarMesesProps) {
  const [mesesSelecionados, setMesesSelecionados] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  const proximosMeses = useMemo(() => {
    const meses = [];
    const dataInicial = new Date(mesOrigem.ano, mesOrigem.mes);

    for (let i = 0; i < 12; i++) {
      const data = new Date(dataInicial);
      data.setMonth(dataInicial.getMonth() + i);

      meses.push({
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
        nome: data.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        }),
        key: `${data.getFullYear()}-${data.getMonth() + 1}`
      });
    }

    return meses;
  }, [mesOrigem]);

  useEffect(() => {
    if (aberto) {
      setMesesSelecionados(new Set(proximosMeses.map(m => m.key)));
    }
  }, [aberto, proximosMeses]);

  const toggleMes = (key: string) => {
    setMesesSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(key)) {
        novo.delete(key);
      } else {
        novo.add(key);
      }
      return novo;
    });
  };

  const marcarTodos = () => {
    setMesesSelecionados(new Set(proximosMeses.map(m => m.key)));
  };

  const desmarcarTodos = () => {
    setMesesSelecionados(new Set());
  };

  const aplicarProximos = (quantidade: number) => {
    const proximos = proximosMeses.slice(0, quantidade).map(m => m.key);
    setMesesSelecionados(new Set(proximos));
  };

  const handleAplicar = async () => {
    try {
      setSalvando(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      for (const key of mesesSelecionados) {
        const [ano, mes] = key.split('-').map(Number);

        await supabase
          .from('cmv_mensal')
          .upsert({
            usuario_id: user.user.id,
            ano,
            mes,
            tipo_dado: 'estimado',
            custos_fixos_estimado: valoresBase.custos_fixos,
            cmv_percentual_estimado: valoresBase.cmv_percentual,
            ticket_medio_estimado: valoresBase.ticket_medio,
            usa_dados_sistema: false
          }, {
            onConflict: 'usuario_id,ano,mes'
          });
      }

      toast.success(`Estimativas aplicadas para ${mesesSelecionados.size} ${mesesSelecionados.size === 1 ? 'mês' : 'meses'}!`);

      if (onSucesso) onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao aplicar:', error);
      toast.error('Erro ao aplicar estimativas');
    } finally {
      setSalvando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Aplicar Estimativas para Outros Meses
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            Valores que serão aplicados:
            <ul className="mt-2 space-y-1">
              <li>• Custos Fixos: {formatarMoeda(valoresBase.custos_fixos)}</li>
              <li>• % CMV: {valoresBase.cmv_percentual}%</li>
              <li>• Ticket Médio: {formatarMoeda(valoresBase.ticket_medio)}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Atalhos rápidos:</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => aplicarProximos(3)}>
              Próximos 3 meses
            </Button>
            <Button variant="outline" size="sm" onClick={() => aplicarProximos(6)}>
              Próximos 6 meses
            </Button>
            <Button variant="outline" size="sm" onClick={() => aplicarProximos(12)}>
              Próximos 12 meses
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Selecione os meses:</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={marcarTodos}>
                Marcar Todos
              </Button>
              <Button variant="ghost" size="sm" onClick={desmarcarTodos}>
                Desmarcar Todos
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
            <div className="grid gap-2">
              {proximosMeses.map(mes => (
                <label key={mes.key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={mesesSelecionados.has(mes.key)}
                    onChange={() => toggleMes(mes.key)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {mes.nome}
                </label>
              ))}
            </div>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {mesesSelecionados.size} 
            {mesesSelecionados.size === 1 ? ' mês selecionado' : ' meses selecionados'}
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            onClick={handleAplicar}
            disabled={mesesSelecionados.size === 0 || salvando}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {salvando 
              ? 'Aplicando...' 
              : `Aplicar para ${mesesSelecionados.size} ${mesesSelecionados.size === 1 ? 'Mês' : 'Meses'}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
