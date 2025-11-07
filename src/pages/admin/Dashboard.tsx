import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImpersonateModal } from '@/components/admin/ImpersonateModal';
import { Users, Activity, HardDrive, AlertCircle, Loader2, Eye, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { metrics, users, activities, loading } = useAdminDashboard();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);

  // Redirecionar se não for admin
  if (!isLoadingAdmin && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  if (isLoadingAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleImpersonate = (user: any) => {
    setSelectedUser(user);
    setImpersonateModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Painel de Administração"
        description="Gerenciamento de usuárias e monitoramento do sistema"
      />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Usuárias"
          value={metrics?.total_users || 0}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="Ativas Hoje"
          value={metrics?.active_users_today || 0}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="Storage Usado"
          value={`${((metrics?.total_storage_used || 0) / 1024 / 1024).toFixed(2)} MB`}
          icon={<HardDrive className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="Exclusões Pendentes"
          value={metrics?.pending_deletions || 0}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Tabela de Usuárias */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Usuárias</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma usuária encontrada
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      {user.deleted_at ? (
                        <Badge variant="destructive">Deletada</Badge>
                      ) : (
                        <Badge variant="default">Ativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImpersonate(user)}
                          disabled={!!user.deleted_at}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Como
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!user.deleted_at}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Atividades Recentes */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Atividades Recentes</h2>
        <ActivityTimeline activities={activities} />
      </Card>

      {/* Modal de Impersonation */}
      {selectedUser && (
        <ImpersonateModal
          user={selectedUser}
          open={impersonateModalOpen}
          onClose={() => {
            setImpersonateModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// Subcomponentes
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}

interface ActivityTimelineProps {
  activities: any[];
}

function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atividade recente
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {activity.admin_email || 'Admin'} {getActionVerb(activity.action)}
                {activity.target_user_email && (
                  <> em <strong>{activity.target_user_email}</strong></>
                )}
              </p>
              <span className="text-xs text-muted-foreground">
                {new Date(activity.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            {activity.reason && (
              <p className="text-xs text-muted-foreground italic">
                Motivo: {activity.reason}
              </p>
            )}
            {activity.module && (
              <Badge variant="outline" className="text-xs">
                {activity.module}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
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
    unsuspend: 'reativou',
  };
  return verbs[action] || 'executou ação';
}
