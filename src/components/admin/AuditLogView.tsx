import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  created_at: string;
  admin_id: string;
  target_user_id?: string | null;
  action: string;
  module?: string | null;
  reason?: string | null;
  old_value?: any;
  new_value?: any;
  ip_address?: unknown;
  record_id?: string | null;
  user_agent?: string | null;
}

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    admin: 'all',
    action: 'all',
    module: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [filters, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Aplicar filtros
      if (filters.admin !== 'all') {
        query = query.eq('admin_id', filters.admin);
      }
      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }
      if (filters.module !== 'all') {
        query = query.eq('module', filters.module);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs(data || []);
    } catch (err: any) {
      toast.error(`Erro ao carregar logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Data/Hora', 'Admin ID', 'Ação', 'Usuária Alvo', 'Módulo', 'Motivo'],
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.admin_id,
        log.action,
        log.target_user_id || '-',
        log.module || '-',
        log.reason || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Log exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Logs de Auditoria</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <Select
            value={filters.action}
            onValueChange={(value) => setFilters({ ...filters, action: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as Ações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="view">Visualização</SelectItem>
              <SelectItem value="edit">Edição</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="impersonate_start">Impersonation Início</SelectItem>
              <SelectItem value="impersonate_end">Impersonation Fim</SelectItem>
              <SelectItem value="soft_delete">Soft Delete</SelectItem>
              <SelectItem value="hard_delete">Hard Delete</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.module}
            onValueChange={(value) => setFilters({ ...filters, module: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os Módulos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Módulos</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="encomendas">Encomendas</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="estoque">Estoque</SelectItem>
              <SelectItem value="receitas">Receitas</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder="Data Inicial"
          />

          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder="Data Final"
          />

          <Button onClick={fetchLogs} variant="outline">
            Atualizar
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {logs.length} registro(s) encontrado(s)
          </p>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={logs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {/* Timeline de Logs */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Carregando logs...</p>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum log encontrado com os filtros selecionados.
          </Card>
        ) : (
          logs.map(log => (
            <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  <p className="text-sm">
                    <strong>Admin {log.admin_id.substring(0, 8)}...</strong> {getActionVerb(log.action)}
                    {log.target_user_id && (
                      <> na conta de <strong>{log.target_user_id.substring(0, 8)}...</strong></>
                    )}
                  </p>
                  
                  {log.module && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Módulo: {log.module}
                    </p>
                  )}
                  
                  {log.reason && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Motivo: {log.reason}
                    </p>
                  )}

                  {log.ip_address && (
                    <p className="text-xs text-muted-foreground mt-1">
                      IP: {String(log.ip_address)}
                    </p>
                  )}
                </div>

                {(log.old_value || log.new_value) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    {expandedLog === log.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {expandedLog === log.id && (log.old_value || log.new_value) && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                  {log.old_value && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Valor Anterior:</p>
                      <pre className="bg-destructive/10 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(log.old_value, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_value && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Valor Novo:</p>
                      <pre className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(log.new_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {logs.length === pageSize && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Página {page + 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}

// Helpers
function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    view: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    edit: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    delete: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    soft_delete: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    hard_delete: 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100',
    impersonate_start: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    impersonate_end: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
  };
  return colors[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    view: 'VISUALIZAÇÃO',
    edit: 'EDIÇÃO',
    delete: 'EXCLUSÃO',
    soft_delete: 'SOFT DELETE',
    hard_delete: 'HARD DELETE',
    impersonate_start: 'ACESSO INICIADO',
    impersonate_end: 'ACESSO ENCERRADO',
    create: 'CRIAÇÃO',
    suspend: 'SUSPENSÃO',
    unsuspend: 'REATIVAÇÃO'
  };
  return labels[action] || action.toUpperCase();
}

function getActionVerb(action: string): string {
  const verbs: Record<string, string> = {
    view: 'visualizou',
    edit: 'editou',
    delete: 'deletou',
    soft_delete: 'marcou para exclusão',
    hard_delete: 'deletou permanentemente',
    impersonate_start: 'iniciou acesso',
    impersonate_end: 'encerrou acesso',
    create: 'criou',
    suspend: 'suspendeu',
    unsuspend: 'reativou'
  };
  return verbs[action] || 'executou ação';
}
