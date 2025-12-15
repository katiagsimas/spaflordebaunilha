import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlterarSenhaObrigatoria } from '@/components/auth/AlterarSenhaObrigatoria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import caixaAcucarLogo from '@/assets/caixa-acucar-logo.png';
import authBackground from '@/assets/auth-background.png';
import { z } from 'zod';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).max(100, { message: "Senha muito longa" })
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Verificar se precisa trocar senha após login
  useEffect(() => {
    const verificarTrocaSenha = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('primeiro_acesso')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.primeiro_acesso) {
          setMostrarAlterarSenha(true);
        }
      }
    };

    verificarTrocaSenha();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const validated = loginSchema.parse({
        email: email.trim(),
        password
      });
      
      await signIn(validated.email, validated.password);
      console.log('Login bem-sucedido, verificando necessidade de troca de senha');
      
      // Verificar se é primeiro acesso (senha padrão)
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        // Atualizar last_login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', loggedUser.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('primeiro_acesso')
          .eq('id', loggedUser.id)
          .maybeSingle();

        // Se primeiro_acesso é true OU se a senha usada foi a padrão, forçar troca
        if (profile?.primeiro_acesso || password === '123456') {
          // Se não estava marcado como primeiro acesso mas usou senha padrão, marcar agora
          if (!profile?.primeiro_acesso && password === '123456') {
            await supabase
              .from('profiles')
              .update({ primeiro_acesso: true })
              .eq('id', loggedUser.id);
          }
          setMostrarAlterarSenha(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Validação falhou - o erro já é visível para o usuário via form validation
      }
      // Outros erros já tratados no contexto
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlterarSenhaObrigatoria open={mostrarAlterarSenha} />
      
      <div className="min-h-screen flex items-center justify-center gradient-subtle p-4 relative overflow-hidden">
      {/* Background Image with Opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      
      {/* Content */}
      <Card className="w-full max-w-md shadow-elevated border-border relative z-10 mt-5">
        <CardHeader className="py-2">
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3 py-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:text-accent hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full gradient-primary"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
    </>
  );
}
