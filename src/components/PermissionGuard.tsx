import { ReactNode } from 'react';
import { useGroup, PermissionFlags } from '@/contexts/GroupContext';
import { AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionGuardProps {
  children?: ReactNode;
  permission?: keyof PermissionFlags;
  requireAdmin?: boolean;
  requireMother?: boolean;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Componente para proteger conteúdo baseado em permissões
 */
export function PermissionGuard({
  children,
  permission,
  requireAdmin = false,
  requireMother = false,
  fallback,
  showMessage = true,
}: PermissionGuardProps) {
  const { hasPermission, isGroupAdmin, isMother, sessionMode, activeGroupId, isLoading } = useGroup();

  if (isLoading) {
    return null;
  }

  // Verificar se requer MOTHER
  if (requireMother && !isMother) {
    return fallback || (showMessage ? <AccessDeniedMessage type="mother" /> : null);
  }

  // Em modo sistema, só permite conteúdo de governança
  if (sessionMode === 'system' && !requireMother) {
    return fallback || (showMessage ? <SystemModeMessage /> : null);
  }

  // Verificar se tem grupo ativo (fora do modo sistema)
  if (sessionMode === 'group' && !activeGroupId) {
    return fallback || (showMessage ? <NoGroupMessage /> : null);
  }

  // Verificar se requer ADMIN
  if (requireAdmin && !isGroupAdmin()) {
    return fallback || (showMessage ? <AccessDeniedMessage type="admin" /> : null);
  }

  // Verificar permissão específica
  if (permission && !hasPermission(permission)) {
    return fallback || (showMessage ? <AccessDeniedMessage type="permission" permission={permission} /> : null);
  }

  return <>{children}</>;
}

function AccessDeniedMessage({ 
  type, 
  permission 
}: { 
  type: 'admin' | 'mother' | 'permission'; 
  permission?: string;
}) {
  const messages = {
    admin: {
      title: 'Acesso Restrito',
      description: 'Apenas administradores do grupo podem acessar esta área.',
    },
    mother: {
      title: 'Acesso Restrito',
      description: 'Apenas o administrador do sistema pode acessar esta área.',
    },
    permission: {
      title: 'Permissão Negada',
      description: `Você não tem permissão para acessar esta funcionalidade${permission ? `: ${permission}` : ''}.`,
    },
  };

  const msg = messages[type];

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Lock className="h-5 w-5" />
          {msg.title}
        </CardTitle>
        <CardDescription>{msg.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function SystemModeMessage() {
  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <AlertCircle className="h-5 w-5" />
          Modo Sistema Ativo
        </CardTitle>
        <CardDescription>
          Você está no modo sistema. Para acessar dados operacionais, selecione um grupo no menu lateral.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function NoGroupMessage() {
  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertCircle className="h-5 w-5" />
          Nenhum Grupo Selecionado
        </CardTitle>
        <CardDescription>
          Selecione um grupo no menu lateral para acessar os dados.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
