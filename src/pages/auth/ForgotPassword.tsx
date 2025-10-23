import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';
import sugarboxAuthLogo from '@/assets/sugarbox-auth-logo.png';
import authBackground from '@/assets/auth-background.jpg';
import { BackButton } from '@/components/BackButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle p-4 relative overflow-hidden">
        {/* Background Image with Opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${authBackground})` }}
        />
        
        {/* Content */}
        <Card className="w-full max-w-md shadow-elevated border-border text-center relative z-10">
          <CardHeader className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Enviado!</CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <p className="text-xs text-muted-foreground">
              Não recebeu o email? Verifique sua caixa de spam ou tente novamente.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <BackButton to="/auth/login" label="Voltar para o login" />
          </CardFooter>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de recuperação
          </CardDescription>
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
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </Button>

            <div className="w-full flex justify-center">
              <BackButton to="/auth/login" label="Voltar para o login" />
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
