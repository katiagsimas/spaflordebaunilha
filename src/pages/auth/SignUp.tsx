import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, Store } from 'lucide-react';
import sugarboxAuthLogo from '@/assets/sugarbox-auth-logo.png';
import authBackground from '@/assets/auth-background.jpg';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).max(100, { message: "Senha muito longa" }),
  confirmPassword: z.string(),
  nomeCompleto: z.string().trim().min(1, { message: "Nome não pode estar vazio" }).max(100, { message: "Nome muito longo" }),
  nomeConfeitaria: z.string().trim().min(1, { message: "Nome da confeitaria não pode estar vazio" }).max(100, { message: "Nome muito longo" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeConfeitaria, setNomeConfeitaria] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const validated = signUpSchema.parse({
        email: email.trim(),
        password,
        confirmPassword,
        nomeCompleto: nomeCompleto.trim(),
        nomeConfeitaria: nomeConfeitaria.trim()
      });

      await signUp(validated.email, validated.password, validated.nomeCompleto, validated.nomeConfeitaria);
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message);
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
              className="h-32 w-auto object-contain"
            />
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="nomeCompleto"
                  type="text"
                  placeholder="Maria Silva"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeConfeitaria">Nome da Confeitaria *</Label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="nomeConfeitaria"
                  type="text"
                  placeholder="Doce Mel Confeitaria"
                  value={nomeConfeitaria}
                  onChange={(e) => setNomeConfeitaria(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
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
                  Criando conta...
                </>
              ) : (
                'Criar Conta Grátis'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-primary hover:text-accent hover:underline"
              >
                Fazer login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
