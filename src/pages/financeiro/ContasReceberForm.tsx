import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import ContasReceberFormModal from '@/components/financeiro/ContasReceberFormModal';

export default function ContasReceberForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditMode = !!id;

  // Estados para dados da conta (quando em modo de edição)
  const [dadosConta, setDadosConta] = useState<any>(null);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      fetchContaReceber();
    }
  }, [id]);

  const fetchContaReceber = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          *,
          cliente:clientes (
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Buscar também a primeira parcela para pegar a data de vencimento
      const { data: parcelas } = await supabase
        .from('contas_receber_parcelas')
        .select('data_vencimento')
        .eq('conta_receber_id', id)
        .order('numero_parcela')
        .limit(1);

      const primeiroVencimento = parcelas?.[0]?.data_vencimento || data.data_vencimento;

      setDadosConta({
        ...data,
        primeiro_vencimento: primeiroVencimento,
      });
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da conta.',
        variant: 'destructive',
      });
      navigate('/financeiro/contas-receber');
    } finally {
      setLoading(false);
    }
  };

  const handleSucesso = (contaId: string) => {
    toast({
      title: '✅ Sucesso',
      description: isEditMode ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!',
    });
    navigate('/financeiro/contas-receber');
  };

  const handleCancelar = () => {
    navigate('/financeiro/contas-receber');
  };

  // Se está em modo de edição e ainda está carregando, mostrar loading
  if (isEditMode && loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/financeiro/contas-receber" />
        <h1 className="text-2xl font-bold">Carregando...</h1>
      </div>
      </div>
    );
  }

  // Se está em modo de edição mas não tem dados, não renderizar
  if (isEditMode && !dadosConta) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/financeiro/contas-receber" />
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Editar Informações' : 'Preencha os Dados'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContasReceberFormModal
            contaReceberId={isEditMode ? id : undefined}
            dataEmissaoInicial={dadosConta?.data_emissao || new Date().toISOString().split('T')[0]}
            clienteIdInicial={dadosConta?.cliente_id || ''}
            clienteNomeInicial={dadosConta?.cliente?.nome || ''}
            descricaoInicial={dadosConta?.descricao || ''}
            valorTotalInicial={dadosConta?.valor || 0}
            planoContasIdInicial={dadosConta?.plano_conta_id || ''}
            tipoDocumentoIdInicial={dadosConta?.tipo_documento_id || ''}
            bancoIdInicial={dadosConta?.banco_id || ''}
            numeroParcelasInicial={dadosConta?.numero_parcelas || 1}
            primeiroVencimentoInicial={dadosConta?.primeiro_vencimento || ''}
            tipoLancamentoInicial={dadosConta?.tipo_lancamento || 'unico'}
            onSucesso={handleSucesso}
            onCancelar={handleCancelar}
          />
        </CardContent>
      </Card>
    </div>
  );
}
