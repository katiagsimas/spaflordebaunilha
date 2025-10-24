import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Clock, User, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";

interface AdminLog {
  id: string;
  admin_id: string;
  admin_email: string;
  acao: string;
  usuario_afetado_id: string | null;
  usuario_afetado_email: string | null;
  detalhes: any;
  created_at: string;
}

export default function LogsAdmin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirecionar se não for admin
  if (!isLoadingAdmin && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  useEffect(() => {
    if (isAdmin) {
      carregarLogs();
    }
  }, [isAdmin]);

  async function carregarLogs() {
    try {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      'desabilitou_usuario': 'Desabilitou Usuário',
      'habilitou_usuario': 'Habilitou Usuário',
      'deletou_cadastros': 'Deletou Cadastros',
      'alterou_permissao': 'Alterou Permissão',
      'excluiu_usuario': 'Excluiu Usuário',
      'criou_usuario': 'Criou Usuário'
    };
    return labels[acao] || acao;
  };

  const getAcaoColor = (acao: string): "default" | "destructive" | "secondary" | "outline" => {
    if (acao.includes('excluiu') || acao.includes('deletou')) return 'destructive';
    if (acao.includes('desabilitou')) return 'secondary';
    if (acao.includes('alterou')) return 'default';
    return 'outline';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Logs de Administração"
        description="Histórico de todas as ações administrativas realizadas no sistema"
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Últimas 100 Ações
          </CardTitle>
          <CardDescription>
            Registro completo de auditoria das ações administrativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <EmptyState
              title="Nenhum log encontrado"
              description="Não há registros de ações administrativas ainda."
              icon={FileText}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário Afetado</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{log.admin_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAcaoColor(log.acao)}>
                          {getAcaoLabel(log.acao)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.usuario_afetado_email || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {log.detalhes && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                              {JSON.stringify(log.detalhes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
