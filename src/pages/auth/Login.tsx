import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlterarSenhaObrigatoria } from '@/components/auth/AlterarSenhaObrigatoria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff, ExternalLink } from 'lucide-react';
import caixaAcucarLogoFull from '@/assets/caixa-acucar-logo-full.png';

import { z } from 'zod';
import { toast } from 'sonner';
import authBrandImage from '@/assets/auth-brand-image.png';
import authRightBg from '@/assets/auth-right-bg.png';
import { URL_UPGRADE_EXTERNO } from '@/lib/constants';

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
  const [planoExpirado, setPlanoExpirado] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

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
    setPlanoExpirado(false);
    try {
      const validated = loginSchema.parse({ email: email.trim(), password });
      await signIn(validated.email, validated.password);

      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', loggedUser.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('primeiro_acesso')
          .eq('id', loggedUser.id)
          .maybeSingle();

        if (profile?.primeiro_acesso) {
          setMostrarAlterarSenha(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error?.message?.toLowerCase?.().includes('expirou')) {
        setPlanoExpirado(true);
      }
      if (error instanceof z.ZodError) {
        // Validation errors
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlterarSenhaObrigatoria open={mostrarAlterarSenha} />

      <div className="min-h-screen flex bg-cda-preto">
        {/* Lado esquerdo — Imagem de marca */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src={authBrandImage}
            alt="Caixa de Açúcar — Gestão para Confeitarias"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Lado direito — Formulário */}
        <div
          className="flex-1 flex items-center justify-center p-6 relative"
          style={{
            backgroundImage: `url(${authRightBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />

          <div className="w-full max-w-md relative z-10 space-y-8">
            {/* Brand header */}
            <div className="text-center">
              <img
                src={caixaAcucarLogoFull}
                alt="Caixa de Açúcar — by Umbrella Doce"
                className="mx-auto w-full max-w-sm h-auto"
              />
            </div>

            {/* Login card */}
            <Card className="bg-cda-creme border-0 shadow-elevated rounded-2xl">
              <CardHeader className="pb-2 pt-5">
                <h2 className="text-xl font-display font-semibold text-cda-preto text-center">
                  Bem-vinda de volta
                </h2>
                <p className="text-sm font-body text-muted-foreground text-center">
                  Acesse sua conta para continuar
                </p>
              </CardHeader>

                <CardContent className="space-y-3 px-8">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-body text-sm font-medium text-cda-preto">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                    <Label htmlFor="password" className="font-body text-sm font-medium text-cda-preto">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/auth/forgot-password"
                      className="text-sm font-body text-cda-dourado hover:underline"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 px-8 pb-5">
                  <Button
                    type="submit"
                    className="w-full"
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

                  {planoExpirado && (
                    <a
                      href={URL_UPGRADE_EXTERNO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-cda-coral text-cda-branco font-body font-semibold py-2.5 rounded-md hover:bg-cda-coral/90 transition-colors text-sm"
                    >
                      Renovar acesso à Imersão
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </CardFooter>

              </form>
            </Card>

            <p className="text-center text-xs font-body text-cda-creme/40">
              Sistema de gestão para confeitarias
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

