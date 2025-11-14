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
import { Info, Upload, X, FileText, Calculator } from 'lucide-react';
import { pagamentoSchema } from '@/schemas/pagamentoSchema';

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
  const [jurosBaixa, setJurosBaixa] = useState('0,00');
  const [descontoBaixa, setDescontoBaixa] = useState('0,00');
  const [bancoId, setBancoId] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [arquivoComprovante, setArquivoComprovante] = useState<File | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [configJuros, setConfigJuros] = useState<any>(null);

  const [bancos, setBancos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [valorPagoPrincipal, setValorPagoPrincipal] = useState(0);

  const valorRestante = parcela ? parcela.valor_parcela - valorPagoPrincipal : 0;

  // Calcular juros automaticamente com base na configuração do usuário
  const calcularJurosAutomatico = (dataVencimento: string, dataPagamento: string, valorParcela: number) => {
    // Se não deve cobrar juros, retornar 0
    if (!configJuros || !configJuros.cobrar_juros) {
      return '0.00';
    }
    
    const venc = new Date(dataVencimento + 'T00:00:00');
    const pag = new Date(dataPagamento + 'T00:00:00');
    
    const diffTime = pag.getTime() - venc.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return '0.00';
    
    let juros = 0;
    let multa = 0;
    
    // Calcular juros
    if (configJuros.tipo_juros === 'mensal') {
      // Juros mensal: divide por 30 para taxa diária
      const taxaDia = configJuros.percentual_juros / 30;
      juros = valorParcela * (taxaDia / 100) * diffDays;
    } else {
      // Juros diário
      juros = valorParcela * (configJuros.percentual_juros / 100) * diffDays;
    }
    
    // Calcular multa (uma vez só)
    if (configJuros.multa_atraso) {
      multa = valorParcela * (configJuros.percentual_multa / 100);
    }
    
    return (juros + multa).toFixed(2);
  };

  // Calcular valor líquido
  const calcularValorLiquido = () => {
    const valor = parseFloat(valorPago.replace(',', '.')) || 0;
    const juros = parseFloat(jurosBaixa.replace(',', '.')) || 0;
    const desconto = parseFloat(descontoBaixa.replace(',', '.')) || 0;
    
    return valor + juros - desconto;
  };

  // Buscar configuração de juros
  const fetchConfigJuros = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('configuracoes_juros')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      setConfigJuros(data);
    } catch (error) {
      console.error('Erro ao buscar config juros:', error);
    }
  };

  useEffect(() => {
    if (open && parcela) {
      fetchDados();
      fetchConfigJuros();
      fetchValorPagoPrincipal();
    }
  }, [open, parcela]);

  useEffect(() => {
    if (open && parcela && valorRestante > 0) {
      // Preencher valor restante automaticamente
      setValorPago(valorRestante.toFixed(2).replace('.', ','));
      const hoje = new Date().toISOString().split('T')[0];
      setDataPagamento(hoje);
      
      setDescontoBaixa('0,00');
      setBancoId('');
      setTipoDocumentoId('');
      setObservacao('');
      setArquivoComprovante(null);
    }
  }, [valorRestante]);

  // Recalcular juros quando valorPago ou dataPagamento mudar
  useEffect(() => {
    if (parcela && dataPagamento && valorPago && configJuros) {
      const valorNumerico = parseFloat(valorPago.replace(',', '.'));
      if (!isNaN(valorNumerico) && valorNumerico > 0) {
        const jurosAuto = calcularJurosAutomatico(
          parcela.data_vencimento,
          dataPagamento,
          valorNumerico
        );
        setJurosBaixa(jurosAuto.replace('.', ','));
      }
    }
  }, [valorPago, dataPagamento, configJuros, parcela]);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar bancos habilitados
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .order('nome');

      setBancos(dataBancos || []);

      // Buscar tipos de documento
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .eq('ativo', true)
        .order('descricao');

      setTiposDocumento(dataTipos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const fetchValorPagoPrincipal = async () => {
    try {
      if (!parcela) return;

      const { data: pagamentos } = await supabase
        .from('contas_receber_pagamentos')
        .select('valor_pago')
        .eq('parcela_id', parcela.id)
        .eq('estornado', false);

      const total = pagamentos?.reduce((acc, p) => acc + (p.valor_pago || 0), 0) || 0;
      setValorPagoPrincipal(total);
    } catch (error) {
      console.error('Erro ao buscar valor pago:', error);
      setValorPagoPrincipal(0);
    }
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Upload de comprovante
  const handleUploadComprovante = async (pagamentoId: string) => {
    if (!arquivoComprovante) return null;
    
    try {
      setUploadando(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Nome único para o arquivo
      const timestamp = new Date().getTime();
      const extensao = arquivoComprovante.name.split('.').pop();
      const nomeArquivo = `${user.id}/${pagamentoId}_${timestamp}.${extensao}`;
      
      // Upload no Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comprovantes-receber')
        .upload(nomeArquivo, arquivoComprovante);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('comprovantes-receber')
        .getPublicUrl(nomeArquivo);
      
      // Salvar registro no banco
      const { error: dbError } = await supabase
        .from('contas_receber_comprovantes')
        .insert({
          pagamento_id: pagamentoId,
          nome_arquivo: arquivoComprovante.name,
          tipo_arquivo: arquivoComprovante.type,
          tamanho_bytes: arquivoComprovante.size,
          url_storage: urlData.publicUrl,
        });
      
      if (dbError) throw dbError;
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    } finally {
      setUploadando(false);
    }
  };

  const handleSalvar = async () => {
    try {
      const valor = parseFloat(valorPago.replace(',', '.'));
      const juros = parseFloat(jurosBaixa.replace(',', '.')) || 0;
      const desconto = parseFloat(descontoBaixa.replace(',', '.')) || 0;
      const valorLiquido = valor + juros - desconto;

      // Validações
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

      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      if (valorLiquido > valorRestante) {
        toast({
          title: 'Erro',
          description: `Valor líquido (${formatarValor(valorLiquido)}) excede o restante (${formatarValor(valorRestante)})`,
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      // Inserir pagamento
      const { data: pagamentoData, error: errorPagamento } = await supabase
        .from('contas_receber_pagamentos')
        .insert({
          parcela_id: parcela.id,
          data_pagamento: dataPagamento,
          valor_pago: valor,
          juros: juros,
          desconto: desconto,
          banco_id: bancoId,
          tipo_documento_id: tipoDocumentoId,
          observacao: observacao.trim() || null,
        })
        .select()
        .single();

      if (errorPagamento) throw errorPagamento;

      // Upload de comprovante (se houver)
      if (arquivoComprovante) {
        try {
          await handleUploadComprovante(pagamentoData.id);
        } catch (uploadError) {
          console.error('Erro no upload, mas pagamento foi salvo:', uploadError);
          toast({
            title: '⚠️ Aviso',
            description: 'Pagamento salvo, mas erro ao anexar comprovante.',
            variant: 'default',
          });
        }
      }

      const novoTotal = (parcela.valor_pago || 0) + valorLiquido;
      const statusPagamento = novoTotal >= parcela.valor_parcela ? 'completo' : 'parcial';

      toast({
        title: '✅ Pagamento registrado',
        description: statusPagamento === 'completo'
          ? 'Parcela paga integralmente!'
          : `Pagamento parcial. Restante: ${formatarValor(parcela.valor_parcela - novoTotal)}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao dar baixa:', error);
      toast({
        title: 'Erro ao dar baixa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dar Baixa na Parcela</DialogTitle>
          <DialogDescription>
            Registre o pagamento com juros, descontos e comprovante
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info da Parcela */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="font-medium">{parcela.cliente_nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Parcela:</span>
              <span className="font-medium">
                {parcela.numero_parcela} de {parcela.numero_parcelas}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimento:</span>
              <span className="font-medium">
                {new Date(parcela.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Total da Parcela:</span>
              <span className="font-medium text-green-600">
                {formatarValor(parcela.valor_parcela)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Já Pago (Principal):</span>
              <span className="font-medium text-blue-600">
                {formatarValor(valorPagoPrincipal)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-medium">Valor Restante:</span>
              <span className="font-bold text-red-600">
                {formatarValor(valorRestante)}
              </span>
            </div>
          </div>

          {parcela.valor_pago > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                Esta parcela já teve pagamento(s) anterior(es).
              </AlertDescription>
            </Alert>
          )}

          {/* Data e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-pag">Data do Pagamento *</Label>
              <Input
                id="data-pag"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>

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
                Os juros serão calculados sobre este valor
              </p>
            </div>
          </div>

          {/* Juros e Descontos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="juros">Juros</Label>
                <Calculator className="h-3 w-3 text-muted-foreground" />
              </div>
              <Input
                id="juros"
                placeholder="0,00"
                value={jurosBaixa}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setJurosBaixa(valor);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente por atraso
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto</Label>
              <Input
                id="desconto"
                placeholder="0,00"
                value={descontoBaixa}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setDescontoBaixa(valor);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Desconto concedido (opcional)
              </p>
            </div>
          </div>

          {/* Cálculo do Valor Líquido */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Valor Líquido a Receber:</span>
              <span className="text-lg font-bold text-blue-700">
                {formatarValor(calcularValorLiquido())}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor + Juros - Desconto
            </p>
          </div>

          {/* Banco e Tipo Doc */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banco *</Label>
              <Select value={bancoId} onValueChange={setBancoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bancos.filter((b: any) => b.id && b.id.trim() !== "").map((banco: any) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.codigo} - {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.filter((t: any) => t.id && t.id.trim() !== "").map((tipo: any) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload de Comprovante */}
          <div className="space-y-2">
            <Label htmlFor="comprovante">Comprovante (Opcional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
              {!arquivoComprovante ? (
                <label
                  htmlFor="comprovante"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para anexar comprovante
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, PNG, JPG (max 5MB)
                  </span>
                  <input
                    id="comprovante"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast({
                            title: 'Erro',
                            description: 'Arquivo muito grande (max 5MB)',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setArquivoComprovante(file);
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{arquivoComprovante.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(arquivoComprovante.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArquivoComprovante(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="obs-baixa">Observação</Label>
            <Textarea
              id="obs-baixa"
              placeholder="Informações adicionais sobre este pagamento..."
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={uploadando || loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar}
            disabled={uploadando || loading}
          >
            {uploadando || loading ? 'Salvando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
