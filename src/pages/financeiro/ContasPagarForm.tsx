import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getTodayISO } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { LoadingMascote } from '@/components/LoadingMascote';
import ContasPagarFormModal from '@/components/financeiro/ContasPagarFormModal';

export default function ContasPagarForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdicao = !!id;

  const [dadosConta, setDadosConta] = useState<any>(null);
  const [loading, setLoading] = useState(isEdicao);

  useEffect(() => {
    if (isEdicao) {
      fetchConta();
    }
  }, [id]);

  const fetchConta = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_pagar' as any)
        .select(`
          *,
          fornecedor:fornecedores ( nome ),
          parcelas:contas_pagar_parcelas ( data_vencimento )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setDadosConta(data);
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da conta.',
        variant: 'destructive',
      });
      navigate('/financeiro/contas-pagar');
    } finally {
      setLoading(false);
    }
  };

  const handleSucesso = () => {
    navigate('/financeiro/contas-pagar');
  };

  const handleCancelar = () => {
    navigate('/financeiro/contas-pagar');
  };

  if (isEdicao && loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-pagar')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        </div>
        <div className="flex justify-center py-12">
          <LoadingMascote size={72} label="Carregando dados..." />
        </div>
      </div>
    );
  }

  if (isEdicao && !dadosConta) {
    return null;
  }

  const c = dadosConta as any;
  const primeiroVencimento = c?.parcelas && c.parcelas.length > 0 ? c.parcelas[0].data_vencimento : '';

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-pagar')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdicao ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </h1>
          <p className="text-muted-foreground">
            {isEdicao ? 'Edite a conta e as parcelas serão recalculadas' : 'Cadastre uma nova conta a pagar'}
          </p>
        </div>
      </div>

      <ContasPagarFormModal
        contaId={id}
        isEdicao={isEdicao}
        dataEmissaoInicial={c?.data_emissao || getTodayISO()}
        fornecedorIdInicial={c?.fornecedor_id || ''}
        fornecedorNomeInicial={c?.fornecedor?.nome || ''}
        tipoDocumentoIdInicial={c?.tipo_documento_id || ''}
        planoContasIdInicial={c?.plano_contas_id || ''}
        bancoIdInicial={c?.banco_id || ''}
        descricaoInicial={c?.descricao || ''}
        valorTotalInicial={c?.valor_total ? Number(c.valor_total).toFixed(2).replace('.', ',') : ''}
        numeroParcelasInicial={c?.numero_parcelas ? String(c.numero_parcelas) : '1'}
        tipoLancamentoInicial={c?.tipo_lancamento || 'unico'}
        primeiroVencimentoInicial={primeiroVencimento}
        onSucesso={handleSucesso}
        onCancelar={handleCancelar}
      />
    </div>
  );
}
