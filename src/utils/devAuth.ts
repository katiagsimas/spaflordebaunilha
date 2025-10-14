/**
 * Utilitário de autenticação para desenvolvimento
 * Permite acesso rápido ao sistema sem precisar digitar credenciais
 */

export const DEV_MODE = import.meta.env.MODE === 'development' || 
                        window.location.hostname.includes('lovable.app');

const ADMIN_EMAIL = 'katiagsimas@gmail.com';
const DEV_CREDENTIALS_KEY = 'dev_admin_credentials';

/**
 * Salva as credenciais de admin para auto-login
 */
export const saveDevCredentials = (email: string, password: string) => {
  if (!DEV_MODE || email !== ADMIN_EMAIL) return;
  
  const credentials = btoa(JSON.stringify({ email, password }));
  localStorage.setItem(DEV_CREDENTIALS_KEY, credentials);
};

/**
 * Recupera as credenciais salvas
 */
export const getDevCredentials = (): { email: string; password: string } | null => {
  if (!DEV_MODE) return null;
  
  try {
    const saved = localStorage.getItem(DEV_CREDENTIALS_KEY);
    if (!saved) return null;
    
    const decoded = JSON.parse(atob(saved));
    if (decoded.email === ADMIN_EMAIL) {
      return decoded;
    }
  } catch (error) {
    console.error('Erro ao recuperar credenciais:', error);
  }
  
  return null;
};

/**
 * Remove as credenciais salvas
 */
export const clearDevCredentials = () => {
  localStorage.removeItem(DEV_CREDENTIALS_KEY);
};

/**
 * Verifica se o usuário atual é a desenvolvedora do sistema
 */
export const isDevUser = (email: string | null | undefined): boolean => {
  return email === ADMIN_EMAIL;
};

/**
 * Verifica se as credenciais estão salvas
 */
export const hasDevCredentials = (): boolean => {
  return DEV_MODE && getDevCredentials() !== null;
};
