import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/LoadingState";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Clock, User, FileText, Loader2, Download, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

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
  const [porPagina, setPorPagina] = useState(10);
  
  // Estados para filtros
  const [filtroDataInicial, setFiltroDataInicial] = useState("");
  const [filtroDataFinal, setFiltroDataFinal] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("todas");
  const [filtroUsuario, setFiltroUsuario] = useState("");

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

  // Filtrar logs
  const logsFiltrados = logs.filter(log => {
    // Filtro de data
    if (filtroDataInicial) {
      const dataLog = new Date(log.created_at);
      const dataInicio = new Date(filtroDataInicial);
      if (dataLog < dataInicio) return false;
    }
    
    if (filtroDataFinal) {
      const dataLog = new Date(log.created_at);
      const dataFim = new Date(filtroDataFinal);
      dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia final
      if (dataLog > dataFim) return false;
    }
    
    // Filtro de ação
    if (filtroAcao !== "todas" && log.acao !== filtroAcao) {
      return false;
    }
    
    // Filtro de usuário afetado
    if (filtroUsuario && log.usuario_afetado_email) {
      if (!log.usuario_afetado_email.toLowerCase().includes(filtroUsuario.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Aplicar paginação
  const logsPaginados = logsFiltrados.slice(0, porPagina);

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroDataInicial("");
    setFiltroDataFinal("");
    setFiltroAcao("todas");
    setFiltroUsuario("");
  };

  // Função de exportar para Excel
  const exportarParaExcel = () => {
    const dadosExportacao = logsFiltrados.map(log => ({
      'Data/Hora': format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      'Administrador': log.admin_email,
      'Ação': getAcaoLabel(log.acao),
      'Usuário Afetado': log.usuario_afetado_email || '-',
      'Detalhes': log.detalhes ? JSON.stringify(log.detalhes) : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs de Ações');
    XLSX.writeFile(wb, `logs-acoes-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: '✅ Exportado',
      description: 'Logs exportados para Excel com sucesso!',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Logs de Administração"
        description="Histórico de todas as ações administrativas realizadas no sistema"
      />
      
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filtroDataInicial}
                onChange={(e) => setFiltroDataInicial(e.target.value)}
              />
            </div>

            {/* Filtro Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={filtroDataFinal}
                onChange={(e) => setFiltroDataFinal(e.target.value)}
              />
            </div>

            {/* Filtro Ação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ação</label>
              <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as ações</SelectItem>
                  <SelectItem value="desabilitou_usuario">Desabilitou Usuário</SelectItem>
                  <SelectItem value="habilitou_usuario">Habilitou Usuário</SelectItem>
                  <SelectItem value="deletou_cadastros">Deletou Cadastros</SelectItem>
                  <SelectItem value="alterou_permissao">Alterou Permissão</SelectItem>
                  <SelectItem value="excluiu_usuario">Excluiu Usuário</SelectItem>
                  <SelectItem value="criou_usuario">Criou Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Usuário Afetado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário Afetado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {(filtroDataInicial || filtroDataFinal || filtroAcao !== "todas" || filtroUsuario) && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={limparFiltros}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Últimas 100 Ações
          </CardTitle>
          <CardDescription>
            Registro completo de auditoria das ações administrativas. Exibindo {logsFiltrados.length} de {logs.length} registros.
          </CardDescription>
          
          {/* Resultados por Página e Exportar */}
          <div className="flex items-center gap-4 pt-4">
            {/* Resultados por Página */}
            <div className="flex items-center gap-2">
              <Select value={porPagina.toString()} onValueChange={(value) => setPorPagina(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">Resultados por Página</span>
            </div>

            {/* Botão Exportar */}
            <Button variant="outline" size="sm" onClick={exportarParaExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar para Excel
            </Button>
          </div>
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
                  {logsPaginados.map((log) => (
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
