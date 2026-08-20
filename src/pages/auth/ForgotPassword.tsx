import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';
import sfbIconAsset from '@/assets/sfb-logo-full.png.asset.json';
const sfbIcon = sfbIconAsset.url;
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

import { BackButton } from '@/components/BackButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('enviar-recuperacao-senha', {
        body: { email: email.trim() }
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: '✅ Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Não foi possível enviar o email. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (sent) {
      return (
        <div className="w-full max-w-md relative z-10 space-y-8">
          {/* Brand header */}
          <div className="text-center">
            <img
              src={sfbIcon}
              alt="Spa Flor de Baunilha"
              className="mx-auto w-full max-w-sm h-auto"
            />
          </div>

          <Card className="bg-sfb-creme border-0 shadow-elevated rounded-2xl">
            <CardHeader className="pb-2 pt-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-display font-semibold text-sfb-preto text-center">
                Email Enviado!
              </h2>
              <p className="text-sm font-body text-muted-foreground text-center">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
            </CardHeader>
            <CardContent className="space-y-4 px-8">
              <p className="text-sm text-muted-foreground text-center">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Não recebeu o email? Verifique sua caixa de spam ou tente novamente.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center px-8 pb-8">
              <BackButton to="/auth/login" label="Voltar para o login" />
            </CardFooter>
          </Card>

        </div>
      );
    }

    return (
      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Brand header */}
        <div className="text-center">
          <img
            src={sfbIcon}
            alt="Spa Flor de Baunilha"
            className="mx-auto w-full max-w-sm h-auto"
          />
        </div>

        <Card className="bg-sfb-creme border-0 shadow-elevated rounded-2xl">
          <CardHeader className="pb-2 pt-8">
            <h2 className="text-xl font-display font-semibold text-sfb-preto text-center">
              Esqueceu sua senha?
            </h2>
            <p className="text-sm font-body text-muted-foreground text-center">
              Digite seu email para receber um link de recuperação
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-8">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body text-sm font-medium text-sfb-preto">Email</Label>
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
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
              <Button
                type="submit"
                className="w-full"
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
  };

  return (
    <AuthSplitLayout>
      {renderContent()}
    </AuthSplitLayout>
  );
}

