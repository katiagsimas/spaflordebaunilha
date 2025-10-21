import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface DarBaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: any;
  onSuccess: () => void;
}

export default function DarBaixaDialog({
  open,
  onOpenChange,
  parcela,
  onSuccess,
}: DarBaixaDialogProps) {
  const { toast } = useToast();

  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [valorPago, setValorPago] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState('');
  const [observacao, setObservacao] = useState('');

  const [bancos, setBancos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loading, setLoading] = useState(false);

  const valorRestante = parcela ? parcela.valor_parcela - (parcela.valor_pago || 0) : 0;

  useEffect(() => {
    if (open) {
      fetchDados();
      // Preencher valor restante automaticamente
      setValorPago(valorRestante.toFixed(2).replace('.', ','));
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setBancoId('');
      setTipoDocumentoId('');
      setObservacao('');
    }
  }, [open, parcela]);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar bancos
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .order('nome');

      setBancos(dataBancos || []);

      // Buscar tipos de documento
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('descricao');

      setTiposDocumento(dataTipos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSalvar = async () => {
    try {
      // Validações
      if (!dataPagamento) {
        toast({
          title: 'Erro',
          description: 'Informe a data do pagamento!',
          variant: 'destructive',
        });
        return;
      }

      if (!bancoId) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!tipoDocumentoId) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(valorPago.replace(',', '.'));
      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      if (valor > valorRestante) {
        toast({
          title: 'Erro',
          description: `Valor não pode ser maior que o restante: ${formatarValor(valorRestante)}`,
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      // Inserir pagamento no histórico
      const { error: errorPagamento } = await supabase
        .from('contas_receber_pagamentos')
        .insert({
          parcela_id: parcela.id,
          data_pagamento: dataPagamento,
          valor_pago: valor,
          banco_id: bancoId,
          tipo_documento_id: tipoDocumentoId,
          observacao: observacao.trim() || null,
        });

      if (errorPagamento) throw errorPagamento;

      // Atualizar parcela
      const novoValorPago = (parcela.valor_pago || 0) + valor;
      const novoStatus = novoValorPago >= parcela.valor_parcela ? 'pago' : 'pagamento_parcial';

      const { error: errorUpdate } = await supabase
        .from('contas_receber_parcelas')
        .update({
          valor_pago: novoValorPago,
          data_pagamento: novoValorPago >= parcela.valor_parcela ? dataPagamento : null,
          status: novoStatus,
        })
        .eq('id', parcela.id);

      if (errorUpdate) throw errorUpdate;

      toast({
        title: '✅ Pagamento registrado',
        description: `Valor de ${formatarValor(valor)} registrado com sucesso!`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dar Baixa - Parcela {parcela.numero_parcela}</DialogTitle>
          <DialogDescription>
            Registre o pagamento parcial ou total desta parcela
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Informações da Parcela */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor da Parcela:</span>
                <span className="font-medium">{formatarValor(parcela.valor_parcela)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Já Pago:</span>
                <span className="font-medium text-green-600">
                  {formatarValor(parcela.valor_pago || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-blue-300">
                <span className="text-muted-foreground font-semibold">Valor Restante:</span>
                <span className="font-bold text-lg text-red-600">
                  {formatarValor(valorRestante)}
                </span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Data Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="data-pagamento">Data do Pagamento *</Label>
            <Input
              id="data-pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </div>

          {/* Valor Pago */}
          <div className="space-y-2">
            <Label htmlFor="valor-pago">Valor Pago *</Label>
            <Input
              id="valor-pago"
              placeholder="Ex: 35,00"
              value={valorPago}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^\d,]/g, '');
                setValorPago(valor);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Máximo: {formatarValor(valorRestante)}
            </p>
          </div>

          {/* Banco */}
          <div className="space-y-2">
            <Label>Banco *</Label>
            <Select value={bancoId} onValueChange={setBancoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco..." />
              </SelectTrigger>
              <SelectContent>
                {bancos.map((banco) => (
                  <SelectItem key={banco.id} value={banco.id}>
                    {banco.codigo} - {banco.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label>Tipo de Documento *</Label>
            <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {tiposDocumento.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Informações adicionais..."
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-4 sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
