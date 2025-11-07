import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Cake, 
  Users, 
  MessageSquare, 
  Bell,
  Gift,
  Phone,
  Mail,
  Heart
} from 'lucide-react';

export function DashboardAniversariantes() {
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth() + 1);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Buscar aniversariantes do mês
  const { data: aniversariantes } = useQuery({
    queryKey: ['aniversariantes', mesSelecionado],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_aniversariantes_mes', { mes_param: mesSelecionado });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filtrar por tipo
  const aniversariantesFiltrados = aniversariantes?.filter((aniv: any) => {
    if (filtroTipo === 'todos') return true;
    return aniv.tipo === filtroTipo;
  }) || [];

  // Agrupar por semana
  const agruparPorSemana = () => {
    const grupos: { [key: string]: any[] } = {
      'hoje': [],
      'esta_semana': [],
      'proximas_semanas': [],
      'passou': []
    };

    aniversariantesFiltrados.forEach((aniv: any) => {
      const dias = aniv.dias_ate_aniversario;
      
      if (dias === 0) {
        grupos.hoje.push(aniv);
      } else if (dias < 0) {
        grupos.passou.push(aniv);
      } else if (dias <= 7) {
        grupos.esta_semana.push(aniv);
      } else {
        grupos.proximas_semanas.push(aniv);
      }
    });

    return grupos;
  };

  const grupos = agruparPorSemana();

  const meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const mensagem = encodeURIComponent(
      `Olá ${nome}! 🎉🎂\n\nFeliz Aniversário! Que este dia seja repleto de alegrias e realizações! ❤️`
    );
    window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${mensagem}`, '_blank');
  };

  const CardAniversariante = ({ aniversariante }: { aniversariante: any }) => {
    const diasRestantes = aniversariante.dias_ate_aniversario;
    
    return (
      <div className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
        {/* Avatar */}
        <div className={`
          h-14 w-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0
          ${diasRestantes === 0 ? 'bg-gradient-to-br from-pink-400 to-purple-500 animate-pulse' : ''}
          ${diasRestantes > 0 && diasRestantes <= 7 ? 'bg-gradient-to-br from-blue-400 to-cyan-500' : ''}
          ${diasRestantes > 7 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : ''}
          ${diasRestantes < 0 ? 'bg-gray-200' : ''}
        `}>
          {aniversariante.tipo === 'cliente' ? '👤' : '👶'}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-medium truncate">{aniversariante.nome}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {aniversariante.tipo === 'familiar' && aniversariante.parentesco && `${aniversariante.parentesco} • `}
                  {new Date(aniversariante.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long'
                  })}
                </Badge>
              </div>
            </div>

            <Badge 
              variant={
                diasRestantes === 0 ? 'default' :
                diasRestantes <= 7 ? 'secondary' :
                'outline'
              }
              className={diasRestantes === 0 ? 'animate-pulse' : ''}
            >
              {diasRestantes === 0 && '🎉 HOJE!'}
              {diasRestantes === 1 && '⭐ Amanhã'}
              {diasRestantes > 1 && diasRestantes <= 7 && `${diasRestantes} dias`}
              {diasRestantes > 7 && `${diasRestantes} dias`}
              {diasRestantes < 0 && 'Passou'}
            </Badge>
          </div>

          {/* Contatos */}
          {aniversariante.telefone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Phone className="h-3 w-3" />
              <span>{aniversariante.telefone}</span>
            </div>
          )}

          {aniversariante.observacoes && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              💡 {aniversariante.observacoes}
            </p>
          )}

          {/* Ações */}
          <div className="flex gap-2 mt-3">
            {aniversariante.telefone && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => abrirWhatsApp(aniversariante.telefone, aniversariante.nome)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
            )}
            {aniversariante.email && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`mailto:${aniversariante.email}`, '_blank')}
              >
                <Mail className="h-3 w-3 mr-1" />
                E-mail
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
            >
              <Bell className="h-3 w-3 mr-1" />
              Lembrete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cake className="h-8 w-8 text-pink-500" />
            Aniversariantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Nunca esqueça de parabenizar seus clientes!
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-3">
        <Select
          value={mesSelecionado.toString()}
          onValueChange={(value) => setMesSelecionado(parseInt(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meses.map((mes) => (
              <SelectItem key={mes.valor} value={mes.valor.toString()}>
                📅 {mes.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="cliente">👤 Clientes</SelectItem>
            <SelectItem value="familiar">👶 Familiares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aniversariantesFiltrados.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aniversariantes
            </p>
          </CardContent>
        </Card>

        <Card className={grupos.hoje.length > 0 ? "border-pink-300 bg-pink-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Cake className="h-4 w-4 text-pink-500" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {grupos.hoje.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aniversários hoje! 🎉
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grupos.esta_semana.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aniversariantesFiltrados.filter((a: any) => a.tipo === 'cliente').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {aniversariantesFiltrados.filter((a: any) => a.tipo === 'familiar').length} familiares
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ALERTAS DE HOJE */}
      {grupos.hoje.length > 0 && (
        <Alert className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300">
          <Gift className="h-4 w-4 text-pink-600" />
          <AlertDescription>
            <div className="font-medium text-pink-900 mb-2">
              🎉 {grupos.hoje.length} aniversariante(s) HOJE!
            </div>
            <div className="space-y-1">
              {grupos.hoje.map((aniv: any, index: number) => (
                <div key={index} className="text-sm text-pink-800">
                  <strong>{aniv.nome}</strong>
                  {aniv.tipo === 'familiar' && aniv.parentesco && ` (${aniv.parentesco})`}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* LISTAS AGRUPADAS */}
      <div className="space-y-6">
        {/* HOJE */}
        {grupos.hoje.length > 0 && (
          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-600" />
                Aniversariantes de Hoje 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grupos.hoje.map((aniv: any, index: number) => (
                <CardAniversariante key={index} aniversariante={aniv} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* ESTA SEMANA */}
        {grupos.esta_semana.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Esta Semana (Próximos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grupos.esta_semana.map((aniv: any, index: number) => (
                <CardAniversariante key={index} aniversariante={aniv} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* PRÓXIMAS SEMANAS */}
        {grupos.proximas_semanas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Resto do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grupos.proximas_semanas.map((aniv: any, index: number) => (
                <CardAniversariante key={index} aniversariante={aniv} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* JÁ PASSARAM */}
        {grupos.passou.length > 0 && (
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-sm">
                Já Passaram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grupos.passou.map((aniv: any, index: number) => (
                <CardAniversariante key={index} aniversariante={aniv} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* VAZIO */}
      {aniversariantesFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Cake className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Nenhum aniversariante em {meses.find(m => m.valor === mesSelecionado)?.nome}
              </p>
              <p className="text-sm mt-2">
                Cadastre as datas de nascimento dos clientes e familiares
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
