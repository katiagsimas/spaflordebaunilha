import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { migrateAllLocalStorageData, cleanLocalStorageAfterMigration, MigrationResult } from '@/services/migrateAllData';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { LoadingState } from '@/components/LoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TableStats {
  table: string;
  count: number;
}

export default function MigrationStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<any>(null);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  
  useEffect(() => {
    if (user) {
      checkMigrationStatus();
      getTableStats();
    }
  }, [user]);
  
  const checkMigrationStatus = () => {
    const completed = localStorage.getItem(`migration_completed_${user?.id}`);
    const date = localStorage.getItem(`migration_date_${user?.id}`);
    const results = localStorage.getItem(`migration_results_${user?.id}`);
    
    setStatus({
      completed: completed === 'true',
      date: date ? new Date(date).toLocaleString('pt-BR') : null,
      results: results ? JSON.parse(results) : []
    });
  };
  
  const getTableStats = async () => {
    try {
      const tables = [
        'clientes', 'fornecedores', 'categorias', 'unidades_medida',
        'custos_fixos', 'embalagens', 'ingredientes', 'encomendas',
        'categorias_financeiras', 'contas_receber', 'contas_pagar', 
        'bancos'
      ];
      
      const stats: TableStats[] = [];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', user?.id);
          
          if (!error && count !== null) {
            stats.push({ table, count });
          }
        } catch (e) {
          // Tabela pode não existir, ignorar
        }
      }
      
      setTableStats(stats.filter(s => s.count > 0));
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const forceMigration = async () => {
    if (!user) return;
    
    setMigrating(true);
    try {
      // Remover flag de migração
      localStorage.removeItem(`migration_completed_${user.id}`);
      
      // Executar novamente
      const result = await migrateAllLocalStorageData(user.id);
      
      toast({
        title: '✅ Migração Concluída!',
        description: `${result.totalRecords} registros foram transferidos para a nuvem.`,
      });
      
      checkMigrationStatus();
      getTableStats();
    } catch (error: any) {
      toast({
        title: '❌ Erro na Migração',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setMigrating(false);
    }
  };
  
  const handleCleanLocalStorage = () => {
    if (!user) return;
    
    if (window.confirm('⚠️ ATENÇÃO: Isso removerá todos os dados do localStorage. Certifique-se de que seus dados estão no Supabase. Continuar?')) {
      cleanLocalStorageAfterMigration(user.id);
      
      toast({
        title: '✅ localStorage Limpo',
        description: 'Dados locais foram removidos com sucesso.',
      });
    }
  };
  
  if (loading) {
    return <LoadingState message="Verificando Status de Migração" submessage="Aguarde enquanto verificamos seus dados..." />;
  }
  
  const totalRecords = tableStats.reduce((sum, s) => sum + s.count, 0);
  const successCount = status?.results.filter((r: MigrationResult) => r.success).length || 0;
  const failureCount = status?.results.filter((r: MigrationResult) => !r.success).length || 0;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader 
        title="Status da Migração para Nuvem"
        description="Visualize o status da migração de dados do localStorage para o Supabase"
        backButton={<BackButton to="/configuracoes" />}
      />
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Esta página mostra o status da migração automática de dados do localStorage para o banco de dados na nuvem.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{totalRecords}</CardTitle>
            <CardDescription>Total de Registros na Nuvem</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{tableStats.length}</CardTitle>
            <CardDescription>Tabelas com Dados</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status?.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span>{status?.completed ? 'Concluída' : 'Pendente'}</span>
            </CardTitle>
            <CardDescription>
              {status?.date ? `Em ${status.date}` : 'Migração não executada'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Dados na Nuvem</CardTitle>
          <CardDescription>Contagem de registros por tabela</CardDescription>
        </CardHeader>
        <CardContent>
          {tableStats.length > 0 ? (
            <div className="space-y-2">
              {tableStats.map(stat => (
                <div key={stat.table} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">{stat.table}</span>
                  <span className="text-muted-foreground">{stat.count} registros</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum dado encontrado na nuvem</p>
          )}
        </CardContent>
      </Card>
      
      {status?.results && status.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Última Migração</CardTitle>
            <CardDescription>
              {successCount} sucesso(s), {failureCount} falha(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.results.map((r: MigrationResult, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{r.tableName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">{r.recordsCount} registros</div>
                    {r.error && <div className="text-xs text-red-600">{r.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>Gerenciar migração e dados locais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={forceMigration} 
            disabled={migrating}
            className="w-full"
          >
            {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Forçar Migração Novamente
          </Button>
          
          <Button 
            onClick={handleCleanLocalStorage} 
            variant="destructive"
            className="w-full"
          >
            Limpar localStorage (Avançado)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
