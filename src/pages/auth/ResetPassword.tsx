import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingMascote } from '@/components/LoadingMascote';
import { BackButton } from '@/components/BackButton';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validarSenhaForte } from '@/lib/validacaoSenha';
import caixaAcucarIcon from '@/assets/caixa-acucar-icon.png';
import authBackground from '@/assets/auth-background.png';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasToken, setHasToken] = useState(false);
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
    // Verifica se há um token de recuperação na URL (hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setHasToken(true);
    } else {
      toast({
        title: "Link inválido",
        description: "Este link de recuperação é inválido ou já expirou.",
        variant: "destructive",
      });
      navigate('/auth/forgot-password');
    }
  }, [navigate, toast]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);

    try {
      // Validar senha forte
      const validacaoSenha = validarSenhaForte({
        password: data.password,
        email: '', // Não temos o email neste contexto
        name: ''   // Não temos o nome neste contexto
      });

      if (!validacaoSenha.valid) {
        form.setError('password', { 
          type: 'manual', 
          message: validacaoSenha.message 
        });
        return;
      }

      // Atualizar senha no Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Sua senha foi alterada. Você já pode fazer login com a nova senha.",
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

  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-umbrella-preto p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${authBackground})` }}
        />
        <Card className="w-full max-w-md bg-umbrella-cloud/90 backdrop-blur-sm border-border relative z-10">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <LoadingMascote size={64} label="Verificando link..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-umbrella-preto p-4 relative overflow-hidden">
      {/* Background Image with Opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      
      {/* Content */}
      <Card className="w-full max-w-md bg-umbrella-cloud/90 backdrop-blur-sm border-border relative z-10">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <img 
              src={caixaAcucarIcon} 
              alt="Caixa de Açúcar"
              className="h-16 w-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha. Ela deve ser forte e segura.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          className="pl-10 pr-10"
                          disabled={loading}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
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
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Digite a senha novamente"
                          className="pl-10 pr-10"
                          disabled={loading}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full gradient-primary"
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
    </div>
  );
}