import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { Percent, Info, Save } from 'lucide-react';

export default function ConfiguracaoJuros() {
  const { toast } = useToast();
  
  const [configId, setConfigId] = useState<string | null>(null);
  const [cobrarJuros, setCobrarJuros] = useState(false);
  const [tipoJuros, setTipoJuros] = useState('mensal');
  const [percentualJuros, setPercentualJuros] = useState('1,00');
  const [multaAtraso, setMultaAtraso] = useState(false);
  const [percentualMulta, setPercentualMulta] = useState('2,00');
  const [aliquotaSimples, setAliquotaSimples] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfiguracao();
  }, []);

  const fetchConfiguracao = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('configuracoes_juros')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfigId(data.id);
        setCobrarJuros(data.cobrar_juros);
        setTipoJuros(data.tipo_juros);
        setPercentualJuros(data.percentual_juros.toString().replace('.', ','));
        setMultaAtraso(data.multa_atraso);
        setPercentualMulta(data.percentual_multa.toString().replace('.', ','));
        const aliq = (data as any).aliquota_simples_nacional;
        setAliquotaSimples(aliq != null ? String(aliq).replace('.', ',') : '');
        setObservacao(data.observacao || '');
      }
    } catch (error: any) {
      console.error('Erro ao buscar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);

      if (cobrarJuros) {
        const percJuros = parseFloat(percentualJuros.replace(',', '.'));
        if (Number.isNaN(percJuros) || percJuros <= 0) {
          toast({
            title: 'Erro de validação',
            description: 'Informe um percentual de juros válido (maior que zero).',
            variant: 'destructive',
          });
          return;
        }
      }

      if (multaAtraso) {
        const percMulta = parseFloat(percentualMulta.replace(',', '.'));
        if (Number.isNaN(percMulta) || percMulta <= 0) {
          toast({
            title: 'Erro de validação',
            description: 'Informe um percentual de multa válido (maior que zero).',
            variant: 'destructive',
          });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      let aliquotaParsed: number | null = null;
      if (aliquotaSimples.trim() !== '') {
        const a = parseFloat(aliquotaSimples.replace(',', '.'));
        if (Number.isNaN(a) || a < 0 || a > 100) {
          toast({
            title: 'Erro de validação',
            description: 'Informe uma alíquota válida entre 0 e 100.',
            variant: 'destructive',
          });
          return;
        }
        aliquotaParsed = a;
      }

      const dados: any = {
        usuario_id: user.id,
        cobrar_juros: cobrarJuros,
        tipo_juros: tipoJuros,
        percentual_juros: parseFloat(percentualJuros.replace(',', '.')),
        multa_atraso: multaAtraso,
        percentual_multa: parseFloat(percentualMulta.replace(',', '.')),
        aliquota_simples_nacional: aliquotaParsed,
        observacao: observacao.trim() || null,
      };

      if (configId) {
        // Atualizar
        const { error } = await supabase
          .from('configuracoes_juros')
          .update(dados)
          .eq('id', configId);

        if (error) throw error;
      } else {
        // Inserir
        const { data, error } = await supabase
          .from('configuracoes_juros')
          .insert(dados)
          .select()
          .single();

        if (error) throw error;
        setConfigId(data.id);
      }

      toast({
        title: '✅ Configuração salva',
        description: 'Configurações de juros atualizadas com sucesso!',
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calcularExemplo = () => {
    if (!cobrarJuros && !multaAtraso) return '0,00';
    
    const valor = 1000;
    const diasAtraso = 30;
    const perc = parseFloat(percentualJuros.replace(',', '.'));
    
    let juros = 0;
    if (cobrarJuros) {
      if (tipoJuros === 'mensal') {
        // Mensal: 1% ao mês = 1% / 30 dias * 30 dias = 1%
        juros = valor * (perc / 100);
      } else {
        // Diário: 0.033% ao dia * 30 dias = ~1%
        juros = valor * (perc / 100) * diasAtraso;
      }
    }
    
    let total = juros;
    if (multaAtraso) {
      const multa = valor * (parseFloat(percentualMulta.replace(',', '.')) / 100);
      total += multa;
    }
    
    return total.toFixed(2).replace('.', ',');
  };

  if (loading) return <LoadingState message="Carregando Configurações" submessage="Buscando taxas de juros..." />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Configuração de Juros e Multas</CardTitle>
            <CardDescription>
              Defina como calcular juros para pagamentos em atraso
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cobrar Juros */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Cobrar Juros por Atraso</Label>
            <p className="text-sm text-muted-foreground">
              Aplicar juros automaticamente em pagamentos atrasados
            </p>
          </div>
          <Switch
            checked={cobrarJuros}
            onCheckedChange={setCobrarJuros}
          />
        </div>

        {cobrarJuros && (
          <>
            {/* Tipo de Juros */}
            <div className="space-y-3">
              <Label>Tipo de Cálculo de Juros</Label>
              <RadioGroup value={tipoJuros} onValueChange={setTipoJuros}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mensal" id="mensal" />
                  <Label htmlFor="mensal" className="cursor-pointer font-normal">
                    Mensal (% ao mês, calculado proporcionalmente por dia)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="diario" id="diario" />
                  <Label htmlFor="diario" className="cursor-pointer font-normal">
                    Diário (% ao dia)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Percentual de Juros */}
            <div className="space-y-2">
              <Label htmlFor="percentual-juros">
                Percentual de Juros ({tipoJuros === 'mensal' ? 'ao mês' : 'ao dia'})
              </Label>
              <div className="flex gap-2">
                <Input
                  id="percentual-juros"
                  placeholder="1,00"
                  value={percentualJuros}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setPercentualJuros(valor);
                  }}
                  className="max-w-xs"
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {tipoJuros === 'mensal' 
                  ? 'Ex: 1% ao mês = 0,033% ao dia (1% ÷ 30 dias)'
                  : 'Ex: 0,033% ao dia = ~1% ao mês (0,033% × 30 dias)'}
              </p>
            </div>
          </>
        )}

        {/* Multa por Atraso */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Multa por Atraso</Label>
              <p className="text-sm text-muted-foreground">
                Aplicar multa fixa (calculada uma única vez)
              </p>
            </div>
            <Switch
              checked={multaAtraso}
              onCheckedChange={setMultaAtraso}
            />
          </div>

          {multaAtraso && (
            <div className="space-y-2">
              <Label htmlFor="percentual-multa">Percentual de Multa</Label>
              <div className="flex gap-2">
                <Input
                  id="percentual-multa"
                  placeholder="2,00"
                  value={percentualMulta}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setPercentualMulta(valor);
                  }}
                  className="max-w-xs"
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Multa aplicada uma única vez sobre o valor da parcela
              </p>
            </div>
          )}
        </div>

        {/* Exemplo de Cálculo */}
        {(cobrarJuros || multaAtraso) && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Exemplo:</strong> Parcela de R$ 1.000,00 com 30 dias de atraso
              <div className="mt-2 space-y-1 text-sm">
                {cobrarJuros && tipoJuros === 'mensal' && (
                  <div>Juros: R$ 1.000 × {percentualJuros}% = R$ {(1000 * parseFloat(percentualJuros.replace(',', '.')) / 100).toFixed(2).replace('.', ',')}</div>
                )}
                {cobrarJuros && tipoJuros === 'diario' && (
                  <div>Juros: R$ 1.000 × {percentualJuros}% × 30 dias = R$ {(1000 * parseFloat(percentualJuros.replace(',', '.')) / 100 * 30).toFixed(2).replace('.', ',')}</div>
                )}
                {multaAtraso && (
                  <div>Multa: R$ 1.000 × {percentualMulta}% = R$ {(1000 * parseFloat(percentualMulta.replace(',', '.')) / 100).toFixed(2).replace('.', ',')}</div>
                )}
                <div className="font-medium pt-1 border-t">
                  Total: R$ {calcularExemplo()}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Alíquota Simples Nacional */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="aliquota-simples" className="text-base font-medium">
            Alíquota efetiva do Simples Nacional (%)
          </Label>
          <div className="flex gap-2">
            <Input
              id="aliquota-simples"
              placeholder="Ex: 6,00"
              value={aliquotaSimples}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^\d,]/g, '');
                setAliquotaSimples(valor);
              }}
              className="max-w-xs"
            />
            <span className="flex items-center text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Usada para calcular o Imposto de Renda e CSLL no DRE (alíquota × LAIR). Deixe em branco caso não esteja enquadrado.
          </p>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observacao">Observações Internas</Label>
          <Textarea
            id="observacao"
            placeholder="Anotações sobre a política de juros da empresa..."
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        {/* Botão Salvar */}
        <Button onClick={handleSalvar} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
