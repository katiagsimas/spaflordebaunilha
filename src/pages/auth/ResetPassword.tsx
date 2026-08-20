import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingMascote } from '@/components/LoadingMascote';
import { BackButton } from '@/components/BackButton';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validarSenhaForte } from '@/lib/validacaoSenha';
import caixaAcucarIcon from '@/assets/caixa-acucar-logo-full.png';
import authBrandImage from '@/assets/auth-brand-image.png';
import authRightBg from '@/assets/auth-right-bg.png';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'A confirmação deve ter no mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      // Método 1: Token via query params (novo fluxo via edge function)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type === 'recovery') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            console.error('Erro ao verificar token:', error);
            toast({
              title: "Link inválido",
              description: "Este link de recuperação é inválido ou já expirou.",
              variant: "destructive",
            });
            navigate('/auth/forgot-password');
            return;
          }

          setHasToken(true);
          setVerifying(false);
          return;
        } catch (err) {
          console.error('Erro ao verificar OTP:', err);
        }
      }

      // Método 2: Token via hash (fluxo legado do Supabase)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const hashType = hashParams.get('type');

      if (accessToken && hashType === 'recovery') {
        setHasToken(true);
        setVerifying(false);
        return;
      }

      // Nenhum token encontrado
      toast({
        title: "Link inválido",
        description: "Este link de recuperação é inválido ou já expirou.",
        variant: "destructive",
      });
      navigate('/auth/forgot-password');
    };

    verifyToken();
  }, [navigate, toast, searchParams]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      const validacaoSenha = validarSenhaForte({
        password: data.password,
        email: '',
        name: ''
      });

      if (!validacaoSenha.valid) {
        form.setError('password', { 
          type: 'manual', 
          message: validacaoSenha.message 
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      });

      if (error) throw error;

      // Marcar primeiro_acesso como false para não exibir diálogo de troca obrigatória
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ primeiro_acesso: false })
          .eq('id', user.id);
      }

      // Fazer logout para forçar novo login limpo
      await supabase.auth.signOut();

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Sua senha foi alterada. Faça login com a nova senha.",
        variant: "default",
      });

      navigate('/auth/login');
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (verifying || !hasToken) {
      return (
        <div className="w-full max-w-md relative z-10 space-y-8">
          <div className="text-center">
            <img
              src={caixaAcucarIcon}
              alt="Spa Flor de Baunilha"
              className="mx-auto w-full max-w-sm h-auto"
            />
          </div>

          <Card className="bg-cda-creme border-0 shadow-elevated rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <LoadingMascote size={64} label="Verificando link..." />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Brand header */}
        <div className="text-center">
          <img
            src={caixaAcucarIcon}
            alt="Spa Flor de Baunilha"
            className="mx-auto w-full max-w-sm h-auto"
          />
        </div>

        <Card className="bg-cda-creme border-0 shadow-elevated rounded-2xl">
          <CardHeader className="pb-2 pt-8">
            <h2 className="text-xl font-display font-semibold text-cda-preto text-center">
              Redefinir Senha
            </h2>
            <p className="text-sm font-body text-muted-foreground text-center">
              Digite sua nova senha. Ela deve ser forte e segura.
            </p>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 px-8">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body text-sm font-medium text-cda-preto">Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite sua nova senha"
                            className="pl-10 pr-10"
                            disabled={loading}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body text-sm font-medium text-cda-preto">Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Digite a senha novamente"
                            className="pl-10 pr-10"
                            disabled={loading}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <LoadingMascote size={20} />
                      <span className="ml-2">Redefinindo...</span>
                    </div>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>

                <div className="w-full flex justify-center">
                  <BackButton to="/auth/login" label="Voltar para o login" />
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <p className="text-center text-xs font-body text-cda-creme/40">
          Sistema de gestão para confeitarias
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-cda-preto">
      {/* Lado esquerdo — Imagem de marca */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={authBrandImage}
          alt="Spa Flor de Baunilha"
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
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        {renderContent()}
      </div>
    </div>
  );
}
