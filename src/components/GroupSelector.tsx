import { useState } from 'react';
import { LoadingMascote } from '@/components/LoadingMascote';
import { useGroup, SessionMode } from '@/contexts/GroupContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, Building2, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GroupSelector() {
  const {
    groups,
    activeGroup,
    activeRole,
    sessionMode,
    isMother,
    isLoading,
    setActiveGroup,
    setSessionMode,
  } = useGroup();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <LoadingMascote size={20} />
        <span>Carregando...</span>
      </div>
    );
  }

  if (groups.length === 0 && !isMother) {
    return null;
  }

  const handleSelectGroup = async (groupId: string) => {
    await setActiveGroup(groupId);
    setOpen(false);
  };

  const handleChangeMode = async (mode: SessionMode) => {
    await setSessionMode(mode);
    setOpen(false);
  };

  const getRoleBadge = (role: string | null) => {
    if (role === 'ADMIN') {
      return <Badge variant="default" className="ml-2 text-xs">Admin</Badge>;
    }
    if (role === 'USER') {
      return <Badge variant="secondary" className="ml-2 text-xs">Usuário</Badge>;
    }
    return null;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between gap-2 bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2 truncate">
            {sessionMode === 'system' ? (
              <>
                <Settings className="h-4 w-4 text-primary" />
                <span className="truncate font-medium">Modo Sistema</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                <span className="truncate">{activeGroup?.name || 'Selecionar grupo'}</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start">
        {isMother && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Modo de Operação
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleChangeMode('system')}
              className={cn(sessionMode === 'system' && 'bg-accent')}
            >
              <Settings className="mr-2 h-4 w-4 text-primary" />
              <span className="flex-1">Modo Sistema</span>
              {sessionMode === 'system' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => groups.length > 0 && handleChangeMode('group')}
              className={cn(sessionMode === 'group' && 'bg-accent')}
              disabled={groups.length === 0}
            >
              <Users className="mr-2 h-4 w-4" />
              <span className="flex-1">Modo Grupo</span>
              {sessionMode === 'group' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {groups.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Seus Grupos
            </DropdownMenuLabel>
            {groups.map((group) => {
              const userRole = group.id === activeGroup?.id ? activeRole : null;
              const isActive = group.id === activeGroup?.id && sessionMode === 'group';
              
              return (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className={cn(isActive && 'bg-accent')}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{group.name}</span>
                  {getRoleBadge(userRole)}
                  {isActive && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {groups.length === 0 && !isMother && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Você não está em nenhum grupo.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
