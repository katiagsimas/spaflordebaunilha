import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import sugarboxAuthLogo from '@/assets/sugarbox-auth-logo.png';
import authBackground from '@/assets/auth-background.jpg';
import { z } from 'zod';
import { DEV_MODE, saveDevCredentials, getDevCredentials, clearDevCredentials, hasDevCredentials } from '@/utils/devAuth';
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
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Auto-login em desenvolvimento se credenciais estiverem salvas
  const handleDevQuickAccess = async () => {
    if (!DEV_MODE) return;

    const savedCreds = getDevCredentials();
    if (!savedCreds) {
      toast.error("Configure o auto-login fazendo login normalmente primeiro");
      return;
    }

    setLoading(true);
    try {
      await signIn(savedCreds.email, savedCreds.password);
      toast.success("✨ Auto-login realizado com sucesso!");
      navigate('/');
    } catch (error: any) {
      console.error("Erro no auto-login:", error);
      // Se falhar, limpar credenciais salvas
      clearDevCredentials();
      toast.error("Auto-login falhou. Faça login novamente para reconfigurar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const validated = loginSchema.parse({
        email: email.trim(),
        password
      });
      
      await signIn(validated.email, validated.password);
      
      // Salvar credenciais para auto-login se for admin em dev mode
      if (DEV_MODE && validated.email === 'katiagsimas@gmail.com') {
        saveDevCredentials(validated.email, validated.password);
        toast.success("✅ Auto-login configurado! Próximas vezes será automático.");
      }
      
      navigate('/');
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
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-4 relative overflow-hidden">
      {/* Background Image with Opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      
      {/* Content */}
      <Card className="w-full max-w-md shadow-elevated border-border relative z-10">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <img 
              src={sugarboxAuthLogo} 
              alt="Sugar Box - O Sistema Completo da Confeiteira" 
              className="h-40 w-auto object-contain"
            />
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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

            {DEV_MODE && hasDevCredentials() && (
              <Button 
                type="button"
                variant="outline" 
                className="w-full border-2 border-amber-500/50 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100"
                size="lg"
                onClick={handleDevQuickAccess}
                disabled={loading}
              >
                <Zap className="mr-2 h-5 w-5 text-amber-500" />
                ⚡ Entrar Automaticamente (Admin)
              </Button>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link
                to="/auth/signup"
                className="font-semibold text-primary hover:text-accent hover:underline"
              >
                Criar conta grátis
              </Link>
            </div>

            {DEV_MODE && (
              <div className="text-xs text-center text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                🔧 <strong>Modo Desenvolvedor</strong><br />
                {hasDevCredentials() 
                  ? "Auto-login configurado ✅ Use o botão acima para entrar automaticamente"
                  : "Faça login normalmente para ativar o auto-login"}
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
