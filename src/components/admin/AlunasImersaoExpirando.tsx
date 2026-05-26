import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { formatDateBR, getTodayISO, addDaysToDate, diffInDays } from '@/lib/dateUtils';

interface AlunaExpirando {
  id: string;
  email: string;
  nome_completo: string | null;
  plano_fim: string;
  imersao_turma: string | null;
}

/**
 * Card admin: lista alunas da Imersão com plano_fim entre hoje e hoje+7.
 */
export function AlunasImersaoExpirando() {
  const { data, isLoading } = useQuery({
    queryKey: ['imersao-alunas-expirando'],
    queryFn: async () => {
      const hoje = getTodayISO();
      const d7 = addDaysToDate(hoje, 7);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nome_completo, plano_fim, imersao_turma')
        .eq('plano_id', 'aluna_imersao')
        .eq('ativo', true)
        .gte('plano_fim', hoje)
        .lte('plano_fim', d7)
        .order('plano_fim', { ascending: true });
      if (error) throw error;
      return (data || []) as AlunaExpirando[];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  const hoje = getTodayISO();

  return (
    <Card className="border-cda-dourado/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cda-vinho">
          <GraduationCap className="h-5 w-5" />
          Alunas da Imersão expirando ({data.length})
        </CardTitle>
        <CardDescription>
          Plano <strong>Aluna da Imersão</strong> com vencimento em até 7 dias. Avisos automáticos por e-mail
          são enviados em D-7, D-3 e D-1.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Dias restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((a) => {
              const dias = diffInDays(a.plano_fim, hoje);
              const variant = dias <= 1 ? 'destructive' : dias <= 3 ? 'default' : 'secondary';
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nome_completo || '-'}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.imersao_turma || '-'}</TableCell>
                  <TableCell>{formatDateBR(a.plano_fim)}</TableCell>
                  <TableCell>
                    <Badge variant={variant}>
                      {dias === 0 ? 'Hoje' : dias === 1 ? '1 dia' : `${dias} dias`}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
