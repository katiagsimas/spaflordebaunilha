import { useState, useEffect } from 'react';
import { useGroup } from '@/contexts/GroupContext';
import { supabase } from '@/integrations/supabase/client';
import { addMonthsToDate, getFirstDayOfMonth, formatDateToISO } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClienteAutocomplete } from '@/components/ClienteAutocomplete';
import { BuscarProdutoRevenda } from '@/components/BuscarProdutoRevenda';
import { PlanoContasAutocomplete } from '@/components/PlanoContasAutocomplete';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ContasReceberFormModalProps {
  dataEmissaoInicial: string;
  clienteIdInicial: string;
  clienteNomeInicial: string;
  descricaoInicial: string;
  valorTotalInicial: number;
  planoContasIdInicial?: string;
  onSucesso: (contaReceberId: string) => void;
  onCancelar: () => void;
}

import { useUserProfile } from '@/hooks/useUserProfile';

export default function ContasReceberFormModal({

  dataEmissaoInicial,
  clienteIdInicial,
  clienteNomeInicial,
  descricaoInicial,
  valorTotalInicial,
  planoContasIdInicial,
  onSucesso,
  onCancelar,
}: ContasReceberFormModalProps) {
  const { activeGroupId } = useGroup();
  const { toast } = useToast();


  const [dataEmissao, setDataEmissao] = useState(dataEmissaoInicial);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [clienteNome, setClienteNome] = useState(clienteNomeInicial);
  const [tipoDocumentoId, setTipoDocumentoId] = useState('');
  const [planoContasId, setPlanoContasId] = useState(planoContasIdInicial || '');
  const [bancoId, setBancoId] = useState('');
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [valorTotal, setValorTotal] = useState(valorTotalInicial.toFixed(2).replace('.', ','));
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [tipoLancamento, setTipoLancamento] = useState('unico');

  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [planosContas, setPlanosContas] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [parcelasGeradas, setParcelasGeradas] = useState<any[]>([]);
  const [parcelasEditadas, setParcelasEditadas] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  // Regenerar parcelas automaticamente quando mudar tipo de lançamento ou número de parcelas
  useEffect(() => {
    if (parcelasGeradas.length > 0 && !parcelasEditadas) {
      handleGerarParcelas();
    }
  }, [tipoLancamento, numeroParcelas]);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar tipos de documentos
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .eq('ativo', true)
        .order('descricao');

      setTiposDocumento(dataTipos || []);

      // Buscar planos de contas (apenas crédito)
      const { data: dataPlanos } = await supabase
        .from('plano_contas')
        .select(`
          id,
          codigo_estruturado,
          descricao,
          ativo,
          padrao_sistema,
          categoria:categorias_plano_contas (
            indicador
          )
        `)
        .or(`user_id.eq.${user.id},padrao_sistema.eq.true`)
        .eq('ativo', true)
        .order('codigo_estruturado');

      const planosCredito = (dataPlanos || []).filter(
        (p: any) => p.categoria?.indicador === 'Credito'
      );
      
      setPlanosContas(planosCredito);

      // Buscar bancos habilitados
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .order('nome');

      setBancos(dataBancos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const handleGerarParcelas = () => {
    // Validações - coletar todos os erros
    const erros: string[] = [];

    if (!tipoDocumentoId) {
      erros.push('• Tipo de Documento');
    }

    if (!planoContasId) {
      erros.push('• Plano de Contas');
    }

    if (!bancoId) {
      erros.push('• Banco');
    }

    const valor = parseFloat(valorTotal.replace(',', '.'));
    if (!valor || valor <= 0) {
      erros.push('• Valor Total (deve ser maior que zero)');
    }

    const parcelas = parseInt(numeroParcelas);
    if (!parcelas || parcelas < 1) {
      erros.push('• Número de Parcelas (deve ser no mínimo 1)');
    }

    if (!primeiroVencimento) {
      erros.push('• Data do Primeiro Vencimento');
    }

    // Se houver erros, mostrar todos de uma vez
    if (erros.length > 0) {
      toast({
        title: 'Campos obrigatórios não preenchidos',
        description: (
          <div className="space-y-1">
            <p className="font-semibold">Preencha os seguintes campos:</p>
            {erros.map((erro, index) => (
              <p key={index} className="text-sm">{erro}</p>
            ))}
          </div>
        ),
        variant: 'destructive',
        duration: 6000,
      });
      return;
    }

    // Gerar parcelas
    const parcelas_geradas = [];

    if (tipoLancamento === 'parcelado' || tipoLancamento === 'unico') {
      const valorParcela = valor / parcelas;

      for (let i = 0; i < parcelas; i++) {
        parcelas_geradas.push({
          numero_parcela: i + 1,
          data_emissao: dataEmissao,
          data_vencimento: addMonthsToDate(primeiroVencimento, i),
          valor_total: valor,
          valor_parcela: valorParcela,
        });
      }
    } else {
      // RECORRENTE
      for (let i = 0; i < parcelas; i++) {
        const dataVenc = addMonthsToDate(primeiroVencimento, i);
        
        parcelas_geradas.push({
          numero_parcela: i + 1,
          data_emissao: getFirstDayOfMonth(dataVenc),
          data_vencimento: dataVenc,
          valor_total: valor,
          valor_parcela: valor,
        });
      }
    }

    setParcelasGeradas(parcelas_geradas);
    setParcelasEditadas(false);
    
    toast({
      title: '✅ Parcelas geradas',
      description: `${parcelas} parcela(s) gerada(s). Revise e edite se necessário.`,
    });
  };

  const handleSalvarParcelamentos = async () => {

    try {
      if (parcelasGeradas.length === 0) {
        toast({
          title: 'Erro',
          description: 'Gere as parcelas antes de salvar!',
          variant: 'destructive',
        });
        return;
      }

      // Validar campos obrigatórios UUID
      if (!tipoDocumentoId || tipoDocumentoId.trim() === '') {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      if (!planoContasId || planoContasId.trim() === '') {
        toast({
          title: 'Erro',
          description: 'Selecione o plano de contas!',
          variant: 'destructive',
        });
        return;
      }

      if (!bancoId || bancoId.trim() === '') {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!clienteId || clienteId.trim() === '') {
        toast({
          title: 'Erro',
          description: 'Cliente inválido!',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const valor = parseFloat(valorTotal.replace(',', '.'));

      // Criar conta a receber
      const { data: conta, error: errorConta } = await supabase
        .from('contas_receber')
        .insert({
          usuario_id: user.id,
          owner_group_id: activeGroupId,
          cliente_id: clienteId,
          data_emissao: dataEmissao,
          tipo_documento_id: tipoDocumentoId,
          plano_conta_id: planoContasId,
          banco_id: bancoId,
          descricao: descricao.trim() || null,
          valor: valor,
          numero_parcelas: parcelasGeradas.length,
          tipo_lancamento: tipoLancamento,
          e_recorrente: tipoLancamento === 'recorrente',
          status: 'pendente',
          data_vencimento: parcelasGeradas[0].data_vencimento,
        })
        .select()
        .single();

      if (errorConta) throw errorConta;

      // Salvar parcelas editadas
      const parcelas_data = parcelasGeradas.map(p => ({
        conta_receber_id: conta.id,
        numero_parcela: p.numero_parcela,
        data_emissao: p.data_emissao,
        data_vencimento: p.data_vencimento,
        valor_total: p.valor_total,
        valor_parcela: p.valor_parcela,
        status: 'aberto',
      }));

      const { error: errorParcelas } = await supabase
        .from('contas_receber_parcelas')
        .insert(parcelas_data);

      if (errorParcelas) throw errorParcelas;

      toast({
        title: '✅ Conta a receber criada',
        description: `${parcelasGeradas.length} parcela(s) salva(s) com sucesso!`,
      });

      onSucesso(conta.id);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditarParcela = (index: number, field: string, value: any) => {
    const novasParcelas = [...parcelasGeradas];
    
    if (field === 'valor_parcela') {
      const valorNumerico = parseFloat(value.replace(',', '.')) || 0;
      novasParcelas[index][field] = valorNumerico;
      
      // Se editou a primeira parcela, recalcular as demais
      if (index === 0 && novasParcelas.length > 1) {
        const valorTotalNumerico = parseFloat(valorTotal.replace(',', '.'));
        const valorPrimeiraParcela = valorNumerico;
        const valorRestante = valorTotalNumerico - valorPrimeiraParcela;
        const parcelasRestantes = novasParcelas.length - 1;
        const valorDemaisParcelas = valorRestante / parcelasRestantes;
        
        for (let i = 1; i < novasParcelas.length; i++) {
          novasParcelas[i].valor_parcela = valorDemaisParcelas;
        }
        
        toast({
          title: '✅ Parcelas recalculadas',
          description: `Demais parcelas ajustadas para R$ ${valorDemaisParcelas.toFixed(2).replace('.', ',')}`,
        });
      }
    } else {
      novasParcelas[index][field] = value;
    }
    
    setParcelasGeradas(novasParcelas);
    setParcelasEditadas(true);
  };

  const handleProdutoRevendaImportado = (insumo: any) => {
    if (insumo.preco_venda > 0) {
      setValorTotal(insumo.preco_venda.toFixed(2).replace('.', ','));
      if (!descricao) {
        setDescricao(`Venda: ${insumo.tipo_insumo.descricao}`);
      }
    } else {
      toast({
        title: "Atenção",
        description: "Este produto está sem Preço de Venda cadastrado.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-6">
      <div className="rounded-lg border p-4 bg-sfb-baunilha/30">
        <BuscarProdutoRevenda 
          onImportado={handleProdutoRevendaImportado}
          hint="Busque por código para preencher o Preço de Venda automaticamente."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-emissao">Data de Emissão *</Label>
        <Input
          id="data-emissao"
          type="date"
          value={dataEmissao}
          onChange={(e) => setDataEmissao(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="space-y-2">
        <Label>Cliente *</Label>
        <ClienteAutocomplete
          value={clienteNome}
          onSelect={handleClienteSelect}
          placeholder="Selecione ou cadastre um cliente..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Documento *</Label>
          <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {tiposDocumento.filter(t => t.id && t.id.trim() !== "").map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Plano de Contas *</Label>
          <PlanoContasAutocomplete
            value={planoContasId}
            planosContas={planosContas.filter((p: any) => p.id && p.id.trim() !== "")}
            onSelect={setPlanoContasId}
            placeholder="Selecione um plano de contas..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Banco *</Label>
        <Select value={bancoId} onValueChange={setBancoId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {bancos.filter(b => b.id && b.id.trim() !== "").map(banco => (
              <SelectItem key={banco.id} value={banco.id}>
                {banco.codigo} - {banco.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor Total *</Label>
        <Input
          id="valor"
          placeholder="Ex: 1000,00"
          value={valorTotal}
          onChange={(e) => {
            const valor = e.target.value.replace(/[^\d,]/g, '');
            setValorTotal(valor);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="space-y-3">
        <Label>Tipo de Lançamento *</Label>
        <RadioGroup value={tipoLancamento} onValueChange={setTipoLancamento}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unico" id="unico" />
            <Label htmlFor="unico" className="cursor-pointer">
              Único (1 parcela)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parcelado" id="parcelado" />
            <Label htmlFor="parcelado" className="cursor-pointer">
              Parcelado (divide valor total)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recorrente" id="recorrente" />
            <Label htmlFor="recorrente" className="cursor-pointer">
              Recorrente (repete valor total)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parcelas">
            {tipoLancamento === 'unico' ? 'Parcelas (fixo)' : 'Número de Parcelas *'}
          </Label>
          <Input
            id="parcelas"
            type="number"
            min="1"
            value={numeroParcelas}
            onChange={(e) => setNumeroParcelas(e.target.value)}
            disabled={tipoLancamento === 'unico'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vencimento">Primeiro Vencimento *</Label>
          <Input
            id="vencimento"
            type="date"
            value={primeiroVencimento}
            onChange={(e) => setPrimeiroVencimento(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Parcelas Geradas */}
      {parcelasGeradas.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Parcelas Geradas</Label>
            {parcelasEditadas && (
              <span className="text-xs text-warning">
                ⚠️ Parcelas editadas
              </span>
            )}
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Vencimento</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {parcelasGeradas.map((parcela, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{parcela.numero_parcela}</td>
                    <td className="p-2">
                      <Input
                        type="date"
                        value={parcela.data_vencimento}
                        onChange={(e) => handleEditarParcela(index, 'data_vencimento', e.target.value)}
                        className="w-40"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={parcela.valor_parcela.toFixed(2).replace('.', ',')}
                        onChange={(e) => {
                          let valor = e.target.value;
                          // Permitir apenas números e vírgula
                          valor = valor.replace(/[^\d,]/g, '');
                          // Garantir apenas uma vírgula
                          const partes = valor.split(',');
                          if (partes.length > 2) {
                            valor = partes[0] + ',' + partes.slice(1).join('');
                          }
                          // Limitar casas decimais a 2
                          if (partes[1] && partes[1].length > 2) {
                            valor = partes[0] + ',' + partes[1].substring(0, 2);
                          }
                          handleEditarParcela(index, 'valor_parcela', valor);
                        }}
                        className="w-40 text-right ml-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted font-semibold">
                <tr>
                  <td colSpan={2} className="p-2 text-right">Total:</td>
                  <td className="p-2 text-right">
                    {parcelasGeradas.reduce((acc, p) => acc + p.valor_parcela, 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancelar}
          disabled={loading}
          className="flex-1"
        >
          Cancelar
        </Button>
        
        {parcelasGeradas.length === 0 ? (
          <Button onClick={handleGerarParcelas} disabled={loading} className="flex-1">
            Gerar Parcelas
          </Button>
        ) : (
          <Button onClick={handleSalvarParcelamentos} disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : 'Salvar Parcelamentos'}
          </Button>
        )}
      </div>
    </div>
  );
}
