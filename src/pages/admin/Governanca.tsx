import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '@/contexts/GroupContext';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGuard } from '@/components/PermissionGuard';
import {
  CalendarDays,
  Settings2,
  UserCog,
  ScrollText,
  CloudUpload,
  ChevronLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import heroBanner from '@/assets/governanca-hero-banner.jpg';
import { HeroBanner } from '@/components/HeroBanner';

interface BackupRow {
  id: string;
  tipo: string | null;
  created_at: string | null;
}

interface AdminLogRow {
  id: string;
  admin_email: string;
  acao: string;
  created_at: string | null;
}

const PALETTE = ['#3D0F1C', '#5B1A2B', '#8B4513', '#C9A14A'];

export default function Governanca() {
  const { isMother } = useGroup();
  const navigate = useNavigate();

  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMother) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: bk }, { data: lg }, { data: rd }] = await Promise.all([
          supabase
            .from('backups')
            .select('id, tipo, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('admin_logs')
            .select('id, admin_email, acao, created_at')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('user_group_roles').select('role_group').eq('is_active', true),
        ]);

        setBackups((bk as any) || []);
        setLogs((lg as any) || []);

        const counts: Record<string, number> = {};
        (rd as any[] | null)?.forEach((r) => {
          const k = (r.role_group || 'USER').toString();
          counts[k] = (counts[k] || 0) + 1;
        });
        const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
        const mapColor: Record<string, string> = {
          ADMIN: '#3D0F1C',
          MOTHER: '#3D0F1C',
          EDITOR: '#5B1A2B',
          BUSINESS: '#5B1A2B',
          USER: '#C9A14A',
          VIEWER: '#C9A14A',
          BASE: '#C9A14A',
        };
        setRoleDistribution(
          Object.entries(counts).map(([k, v]) => ({
            name: k,
            value: Math.round((v / total) * 100),
            color: mapColor[k] || '#8B4513',
          })),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [isMother]);

  const actionsByUser = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach((l) => {
      const k = (l.admin_email || '—').split('@')[0].slice(0, 8);
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [logs]);

  const actionsByDay = useMemo(() => {
    const m: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      m[k] = 0;
    }
    logs.forEach((l) => {
      if (!l.created_at) return;
      const d = new Date(l.created_at);
      const k = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (k in m) m[k] += 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [logs]);

  if (!isMother) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EE]">
        <PageHeader title="Governança" description="Acesso restrito" />
        <div className="flex-1 p-6">
          <PermissionGuard requireMother />
        </div>
      </div>
    );
  }

  const navCards = [
    {
      title: 'Log de Ações',
      icon: ScrollText,
      desc: 'Histórico de ações realizadas pelos usuários no sistema.',
      url: '/admin/logs',
    },
    {
      title: 'Cofre de Backups',
      icon: CloudUpload,
      desc: 'Espelho automático de backups de todos os grupos (dia 1 + 5 últimos).',
      url: '/configuracoes/backup',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      <div className="max-w-7xl mx-auto px-6 pt-1 pb-6 space-y-6">
        {/* HERO BANNER padronizado */}
        <HeroBanner
          image={heroBanner}
          title="Governança"
          subtitle="Administração e auditoria do sistema."
        />

        {/* Nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {navCards.map(({ title, icon: Icon, desc, url }) => (
            <button
              key={url}
              type="button"
              onClick={() => navigate(url)}
              className="text-left bg-white border border-[#5B1A2B]/10 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-[#C9A14A]/50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 52, height: 52, background: '#FDF6EE' }}
                >
                  <Icon className="w-6 h-6 text-[#5B1A2B]" />
                </div>
                <h3 className="font-bold text-[18px] text-[#3D0F1C]">{title}</h3>
              </div>

              <div
                className="my-4 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ height: 120, background: '#FDF6EE' }}
              >
                <img
                  src={heroBanner}
                  alt=""
                  loading="lazy"
                  className="object-cover w-full h-full"
                  style={{
                    objectPosition:
                      title === 'Usuários'
                        ? '15% center'
                        : title === 'Log de Ações'
                          ? '50% center'
                          : '85% center',
                  }}
                />
              </div>

              <p className="text-[13px] text-[#3D0F1C]/65 font-body">{desc}</p>

              {title === 'Cofre de Backups' && (
                <div className="mt-3 border-t border-[#5B1A2B]/10 pt-2">
                  <div className="grid grid-cols-2 text-[11px] font-semibold text-[#3D0F1C] mb-1">
                    <span>Backup</span>
                    <span>Data</span>
                  </div>
                  {(backups.slice(0, 3)).map((b) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-2 text-[11px] text-[#3D0F1C]/70 py-0.5"
                    >
                      <span className="truncate">{b.tipo || 'Backup'}</span>
                      <span>
                        {b.created_at
                          ? new Date(b.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '—'}
                      </span>
                    </div>
                  ))}
                  {backups.length === 0 && (
                    <div className="text-[11px] text-[#3D0F1C]/40 py-1">
                      {loading ? 'Carregando…' : 'Sem backups ainda.'}
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Visão Geral da Auditoria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Painel esquerdo */}
          <div className="bg-white border border-[#5B1A2B]/10 rounded-xl p-5">
            <h2 className="font-display text-[18px] text-[#3D0F1C] mb-4">
              Visão Geral da Auditoria
            </h2>
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg overflow-hidden shrink-0 hidden sm:block"
                style={{ width: 120, height: 160, background: '#FDF6EE' }}
              >
                <img
                  src={heroBanner}
                  alt=""
                  loading="lazy"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1" style={{ height: 160 }}>
                {actionsByUser.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[12px] text-[#3D0F1C]/50">
                    {loading ? 'Carregando…' : 'Sem ações registradas ainda.'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={actionsByUser} margin={{ top: 16, right: 4, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#3D0F1C' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: '#FDF6EE' }}
                        contentStyle={{
                          background: '#FFF9F5',
                          border: '1px solid #5B1A2B22',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {actionsByUser.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          style={{ fontSize: 11, fill: '#3D0F1C' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Painel direito */}
          <div className="bg-white border border-[#5B1A2B]/10 rounded-xl p-5">
            <h2 className="font-display text-[18px] text-[#3D0F1C] mb-4">
              Visão Geral da Auditoria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ações Recentes por Usuário */}
              <div>
                <p className="font-body text-[12px] font-bold text-[#3D0F1C] mb-2">
                  Ações Recentes por Usuário
                </p>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={actionsByDay} margin={{ top: 16, right: 4, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#3D0F1C' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: '#FDF6EE' }}
                        contentStyle={{
                          background: '#FFF9F5',
                          border: '1px solid #5B1A2B22',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {actionsByDay.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? '#3D0F1C' : '#8B4513'} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          style={{ fontSize: 10, fill: '#3D0F1C' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribuição de Permissões */}
              <div>
                <p className="font-body text-[12px] font-bold text-[#3D0F1C] mb-2">
                  Distribuição de Permissões
                </p>
                <div className="flex items-center gap-2" style={{ height: 140 }}>
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={
                            roleDistribution.length > 0
                              ? roleDistribution
                              : [{ name: '—', value: 1, color: '#FDF6EE' }]
                          }
                          dataKey="value"
                          innerRadius={45}
                          outerRadius={70}
                          stroke="none"
                        >
                          {(roleDistribution.length > 0
                            ? roleDistribution
                            : [{ name: '—', value: 1, color: '#FDF6EE' }]
                          ).map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-1 text-[12px] text-[#3D0F1C]">
                    {roleDistribution.length === 0 ? (
                      <li className="text-[#3D0F1C]/40">—</li>
                    ) : (
                      roleDistribution.map((d) => (
                        <li key={d.name} className="flex items-center gap-2">
                          <span
                            className="inline-block"
                            style={{ width: 10, height: 10, background: d.color, borderRadius: 2 }}
                          />
                          <span className="capitalize">{d.name.toLowerCase()}</span>
                          <span className="ml-1 text-[#3D0F1C]/70">{d.value}%</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Voltar"
        className="fixed bottom-6 right-6 z-50 rounded-full w-11 h-11 flex items-center justify-center shadow-lg text-white hover:opacity-90 transition"
        style={{ background: '#5B1A2B' }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
}
