import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTodayISO, formatDateToISO } from '@/lib/dateUtils';

export interface InadimplenciaItem {
  id: string;
  nome: string;
  valor: number;
  dias_atraso: number;
  telefone?: string;
}

export interface ResumoFinanceiro {
  totalReceber: number;
  totalPagar: number;
  receitasRecebidas: number;
  despesasPagas: number;
  saldoLiquido: number;
}

const RESUMO_INICIAL: ResumoFinanceiro = {
  totalReceber: 0,
  totalPagar: 0,
  receitasRecebidas: 0,
  despesasPagas: 0,
  saldoLiquido: 0,
};

export function useResumoDashboard() {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<ResumoFinanceiro>(RESUMO_INICIAL);
  const [inadimplenciaClientes, setInadimplenciaClientes] = useState<InadimplenciaItem[]>([]);
  const [inadimplenciaFornecedores, setInadimplenciaFornecedores] = useState<InadimplenciaItem[]>([]);

  const carregarResumo = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const inicioMes = formatDateToISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    const { data: parcelasReceber } = await supabase
      .from('vw_contas_receber_parcelas')
      .select('*')
      .eq('user_id', user.id);

    const { data: parcelasPagar } = await supabase
      .from('contas_pagar_parcelas')
      .select(`
        *,
        conta:contas_pagar!inner (
          usuario_id
        )
      `)
      .eq('conta.usuario_id', user.id);

    let totalReceber = 0;
    let receitasRecebidas = 0;

    parcelasReceber?.forEach((p: any) => {
      if (p.status === 'aberto' || p.status === 'atrasado') {
        totalReceber += (p.valor_parcela || 0) - (p.valor_pago || 0);
      } else if (p.status === 'pagamento_parcial') {
        const valorPago = p.valor_pago || 0;
        const valorPendente = (p.valor_parcela || 0) - valorPago;
        totalReceber += valorPendente;
        receitasRecebidas += valorPago;
      } else if ((p.status === 'pago' || p.status === 'adiantado') && p.data_pagamento >= inicioMes) {
        receitasRecebidas += p.valor_pago || 0;
      }
    });

    let totalPagar = 0;
    let despesasPagas = 0;

    parcelasPagar?.forEach((p: any) => {
      if (p.status === 'aberto' || p.status === 'atrasado') {
        totalPagar += (p.valor_parcela || 0) - (p.valor_pago || 0);
      } else if (p.status === 'pagamento_parcial') {
        const valorPago = p.valor_pago || 0;
        const valorPendente = (p.valor_parcela || 0) - valorPago;
        totalPagar += valorPendente;
        despesasPagas += valorPago;
      } else if ((p.status === 'pago' || p.status === 'adiantado') && p.data_pagamento >= inicioMes) {
        despesasPagas += p.valor_pago || 0;
      }
    });

    setResumo({
      totalReceber,
      totalPagar,
      receitasRecebidas,
      despesasPagas,
      saldoLiquido: receitasRecebidas - despesasPagas,
    });
  }, []);

  const carregarInadimplenciaClientes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hoje = getTodayISO();

    const { data } = await supabase
      .from('vw_contas_receber_parcelas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'atrasado')
      .order('data_vencimento', { ascending: true });

    if (!data) {
      setInadimplenciaClientes([]);
      return;
    }

    const inadimplentesMap = new Map<string, InadimplenciaItem>();

    for (const parcela of data) {
      const vencimento = new Date(parcela.data_vencimento + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const diasAtraso = Math.floor((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      const clienteId = parcela.cliente_id || parcela.id;
      const clienteNome = parcela.cliente_nome || 'Cliente desconhecido';
      const valorDevido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);

      if (inadimplentesMap.has(clienteId)) {
        const existing = inadimplentesMap.get(clienteId)!;
        existing.valor += valorDevido;
        existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
      } else {
        inadimplentesMap.set(clienteId, {
          id: clienteId,
          nome: clienteNome,
          valor: valorDevido,
          dias_atraso: diasAtraso,
          telefone: undefined,
        });
      }
    }

    // Buscar telefones em lote com uma única query (.in)
    const clienteIds = Array.from(inadimplentesMap.keys());
    if (clienteIds.length > 0) {
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, telefone')
        .in('id', clienteIds);

      const telefoneMap = new Map<string, string | null>();
      clientes?.forEach((c) => telefoneMap.set(c.id, c.telefone));

      for (const item of inadimplentesMap.values()) {
        item.telefone = telefoneMap.get(item.id) || undefined;
      }
    }

    const agrupado = Array.from(inadimplentesMap.values());
    agrupado.sort((a, b) => b.valor - a.valor);

    setInadimplenciaClientes(agrupado);
  }, []);

  const carregarInadimplenciaFornecedores = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hoje = getTodayISO();

    const { data: parcelas } = await supabase
      .from('contas_pagar_parcelas')
      .select(`
        id,
        valor_parcela,
        valor_pago,
        data_vencimento,
        status,
        contas_pagar!inner (
          fornecedor_id,
          usuario_id,
          fornecedores (
            id,
            nome,
            telefone
          )
        )
      `)
      .eq('status', 'atrasado')
      .eq('contas_pagar.usuario_id', user.id)
      .order('data_vencimento', { ascending: true });

    if (!parcelas || parcelas.length === 0) {
      setInadimplenciaFornecedores([]);
      return;
    }

    const inadimplentesMap = new Map<string, InadimplenciaItem>();

    for (const parcela of parcelas) {
      const vencimento = new Date(parcela.data_vencimento + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const diasAtraso = Math.floor((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      const contaPagar = parcela.contas_pagar as any;
      const fornecedor = contaPagar?.fornecedores;
      const fornecedorId = contaPagar?.fornecedor_id;

      if (!fornecedorId) continue;

      const valorDevido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);

      if (inadimplentesMap.has(fornecedorId)) {
        const existing = inadimplentesMap.get(fornecedorId)!;
        existing.valor += valorDevido;
        existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
      } else {
        inadimplentesMap.set(fornecedorId, {
          id: fornecedorId,
          nome: fornecedor?.nome || 'Fornecedor desconhecido',
          valor: valorDevido,
          dias_atraso: diasAtraso,
          telefone: fornecedor?.telefone,
        });
      }
    }

    const agrupado = Array.from(inadimplentesMap.values());
    agrupado.sort((a, b) => b.valor - a.valor);

    setInadimplenciaFornecedores(agrupado);
  }, []);

  const recarregar = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarResumo(),
        carregarInadimplenciaClientes(),
        carregarInadimplenciaFornecedores(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dashboard financeiro:', error);
    } finally {
      setLoading(false);
    }
  }, [carregarResumo, carregarInadimplenciaClientes, carregarInadimplenciaFornecedores]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return {
    loading,
    resumo,
    inadimplenciaClientes,
    inadimplenciaFornecedores,
    recarregar,
  };
}
