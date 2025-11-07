import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminMetrics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  total_storage_used: number;
  recent_errors: number;
  pending_deletions: number;
}

interface User {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  deleted_at?: string | null;
  raw_user_meta_data?: any;
}

interface Activity {
  id: string;
  created_at: string;
  action: string;
  module: string | null;
  reason: string | null;
  admin_email: string | null;
  target_user_email: string | null;
  admin_id: string;
  target_user_id: string | null;
}

/**
 * Hook para buscar dados do dashboard de administração
 * Atualiza automaticamente a cada 30 segundos
 */
export function useAdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics via RPC
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_admin_dashboard_metrics');
      
      if (metricsError) throw metricsError;
      setMetrics(metricsData?.[0] || null);
      
      // Fetch users from auth.users
      const { data: { users: usersData }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;
      setUsers((usersData || []) as User[]);
      
      // Fetch activities via RPC
      const { data: activitiesData, error: activitiesError } = await supabase
        .rpc('get_admin_recent_activity');
      
      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
      
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar dados';
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    users,
    activities,
    loading,
    error,
    refetch: fetchData
  };
}
