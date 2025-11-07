import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  MessageSquare,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface NPSFormData {
  cliente_id: string;
  encomenda_id: string | null;
  nota: number;
  comentario: string;
}

export function NPSManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<number | null>(null);
  const [formData, setFormData] = useState<NPSFormData>({
    cliente_id: '',
    encomenda_id: null,
    nota: 0,
    comentario: ''
  });
  const queryClient = useQueryClient();

  // Buscar clientes para o dropdown
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome') as any;
      if (error) throw error;
      return (data || []) as Array<{ id: string; nome: string }>;
    }
  });

  // Buscar encomendas entregues do cliente selecionado
  const { data: encomendas = [] } = useQuery({
    queryKey: ['encomendas-entregues', formData.cliente_id],
    queryFn: async () => {
      if (!formData.cliente_id) return [];
      
      const { data, error } = await supabase
        .from('encomendas')
        .select('id, data_entrega, valor') as any;
      
      if (error) throw error;
      return (data || []) as Array<{ id: string; data_entrega: string; valor: number }>;
    },
    enabled: !!formData.cliente_id
  });

  // Buscar todas as avaliações
  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['nps-avaliacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cliente_nps')
        .select(`
          *,
          clientes(nome)
        `) as any;
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  // Mutation para salvar NPS
  const salvarNPS = useMutation({
    mutationFn: async (dados: NPSFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('cliente_nps')
        .insert([{
          usuario_id: user.id,
          cliente_id: dados.cliente_id,
          encomenda_id: dados.encomenda_id,
          nota: dados.nota,
          comentario: dados.comentario || null,
          respondido_em: new Date().toISOString()
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps-avaliacoes'] });
      toast.success('Avaliação registrada com sucesso!');
      limparFormulario();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar avaliação');
    }
  });

  const limparFormulario = () => {
    setFormData({
      cliente_id: '',
      encomenda_id: null,
      nota: 0,
      comentario: ''
    });
    setNotaSelecionada(null);
  };

  // Calcular NPS Score
  const calcularNPS = () => {
    if (!avaliacoes || avaliacoes.length === 0) return null;

    const promotores = avaliacoes.filter(a => a.categoria === 'promotor').length;
    const detratores = avaliacoes.filter(a => a.categoria === 'detrator').length;
    const total = avaliacoes.length;

    const nps = ((promotores - detratores) / total) * 100;
    return Math.round(nps);
  };

  // Dados para o gráfico de pizza
  const dadosDistribuicao = avaliacoes ? [
    {
      name: 'Promotores',
      value: avaliacoes.filter(a => a.categoria === 'promotor').length,
      color: '#22c55e'
    },
    {
      name: 'Neutros',
      value: avaliacoes.filter(a => a.categoria === 'neutro').length,
      color: '#f59e0b'
    },
    {
      name: 'Detratores',
      value: avaliacoes.filter(a => a.categoria === 'detrator').length,
      color: '#ef4444'
    }
  ] : [];

  // Dados para gráfico de evolução
  const dadosEvolucao = avaliacoes ? avaliacoes
    .slice()
    .reverse()
    .map((avaliacao, index) => ({
      index: index + 1,
      nota: avaliacao.nota
    })) : [];

  const npsScore = calcularNPS();

  const getNPSColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-lime-600';
    if (score >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getNPSLabel = (score: number | null) => {
    if (score === null) return 'Sem dados';
    if (score >= 75) return 'Excelente';
    if (score >= 50) return 'Muito Bom';
    if (score >= 0) return 'Razoável';
    return 'Crítico';
  };

  return (
    <div className="space-y-6">
      {/* HEADER COM NPS SCORE */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Net Promoter Score (NPS)</h2>
          <p className="text-muted-foreground">
            Avalie a satisfação dos seus clientes
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Star className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Avaliação NPS</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, cliente_id: value, encomenda_id: null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Encomenda (opcional) */}
              {formData.cliente_id && encomendas && encomendas.length > 0 && (
                <div className="space-y-2">
                  <Label>Encomenda (Opcional)</Label>
                  <Select
                    value={formData.encomenda_id || ''}
                    onValueChange={(value) => 
                      setFormData({ ...formData, encomenda_id: value || null })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a encomenda..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma encomenda específica</SelectItem>
                      {encomendas.map((encomenda) => (
                        <SelectItem key={encomenda.id} value={encomenda.id}>
                          {new Date(encomenda.data_entrega).toLocaleDateString('pt-BR')} - 
                          R$ {encomenda.valor.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Escala NPS */}
              <div className="space-y-3">
                <Label>De 0 a 10, quanto você recomendaria seu serviço? *</Label>
                <div className="flex gap-2 justify-between">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nota) => (
                    <Button
                      key={nota}
                      type="button"
                      variant={notaSelecionada === nota ? 'default' : 'outline'}
                      className={`w-10 h-10 p-0 ${
                        notaSelecionada === nota
                          ? nota <= 6
                            ? 'bg-red-500 hover:bg-red-600'
                            : nota <= 8
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-green-500 hover:bg-green-600'
                          : ''
                      }`}
                      onClick={() => {
                        setNotaSelecionada(nota);
                        setFormData({ ...formData, nota });
                      }}
                    >
                      {nota}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Não recomendaria</span>
                  <span>Recomendaria muito</span>
                </div>
                
                {notaSelecionada !== null && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted">
                    {notaSelecionada <= 6 && (
                      <>
                        <ThumbsDown className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Detrator - Precisa melhorar</span>
                      </>
                    )}
                    {notaSelecionada >= 7 && notaSelecionada <= 8 && (
                      <>
                        <Minus className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Neutro - Satisfeito</span>
                      </>
                    )}
                    {notaSelecionada >= 9 && (
                      <>
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Promotor - Muito satisfeito!</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Comentário */}
              <div className="space-y-2">
                <Label>Comentário (Opcional)</Label>
                <Textarea
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Qual foi o motivo dessa nota?"
                  rows={4}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    limparFormulario();
                    setIsOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => salvarNPS.mutate(formData)}
                  disabled={!formData.cliente_id || notaSelecionada === null}
                >
                  Salvar Avaliação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NPS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getNPSColor(npsScore)}`}>
              {npsScore !== null ? npsScore : '--'}
            </div>
            <Badge variant="secondary" className="mt-2">
              {getNPSLabel(npsScore)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              Promotores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {avaliacoes?.filter(a => a.categoria === 'promotor').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Notas 9-10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Minus className="h-4 w-4 text-orange-500" />
              Neutros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {avaliacoes?.filter(a => a.categoria === 'neutro').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Notas 7-8
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              Detratores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {avaliacoes?.filter(a => a.categoria === 'detrator').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Notas 0-6
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Avaliações</CardTitle>
            <CardDescription>
              Como seus clientes avaliam seu serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dadosDistribuicao.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosDistribuicao}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma avaliação registrada ainda</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução das Notas</CardTitle>
            <CardDescription>
              Histórico de avaliações recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dadosEvolucao.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="nota" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma avaliação para mostrar evolução</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE AVALIAÇÕES RECENTES */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {avaliacoes && avaliacoes.length > 0 ? (
            <div className="space-y-4">
              {avaliacoes.slice(0, 10).map((avaliacao: any) => (
                <div
                  key={avaliacao.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className={`
                    h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold
                    ${avaliacao.categoria === 'promotor' ? 'bg-green-100 text-green-700' : ''}
                    ${avaliacao.categoria === 'neutro' ? 'bg-orange-100 text-orange-700' : ''}
                    ${avaliacao.categoria === 'detrator' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {avaliacao.nota}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{avaliacao.clientes?.nome}</span>
                      <Badge variant={
                        avaliacao.categoria === 'promotor' ? 'default' :
                        avaliacao.categoria === 'neutro' ? 'secondary' :
                        'destructive'
                      }>
                        {avaliacao.categoria === 'promotor' && <ThumbsUp className="h-3 w-3 mr-1" />}
                        {avaliacao.categoria === 'neutro' && <Minus className="h-3 w-3 mr-1" />}
                        {avaliacao.categoria === 'detrator' && <ThumbsDown className="h-3 w-3 mr-1" />}
                        {avaliacao.categoria}
                      </Badge>
                    </div>
                    
                    {avaliacao.comentario && (
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {avaliacao.comentario}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(avaliacao.respondido_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma avaliação registrada ainda</p>
              <p className="text-sm mt-1">Clique em "Nova Avaliação" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
