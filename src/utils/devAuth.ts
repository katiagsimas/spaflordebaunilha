/**
 * Utilitário de autenticação para desenvolvimento
 * Permite acesso rápido ao sistema sem precisar digitar credenciais
 */

export const DEV_MODE = import.meta.env.MODE === 'development' || 
                        window.location.hostname.includes('lovable.app');

export const DEV_CREDENTIALS = {
  email: 'katiagsimas@gmail.com',
  // Nota: A senha real deve ser mantida apenas por você
  // Este é um placeholder - você deve substituir pela sua senha real
  password: 'SuaSenhaAqui123'
};

/**
 * Verifica se o usuário atual é a desenvolvedora do sistema
 */
export const isDevUser = (email: string | null | undefined): boolean => {
  return email === DEV_CREDENTIALS.email;
};
