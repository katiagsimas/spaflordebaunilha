/**
 * Utilitários para manipulação de datas SEM problemas de timezone
 * 
 * PROBLEMA: Quando usamos new Date('2025-01-15') ou toISOString(), o JavaScript
 * interpreta como UTC, causando deslocamento de -1 dia para timezones negativos (ex: America/Sao_Paulo)
 * 
 * SOLUÇÃO: Todas as datas de calendário (sem horário) devem ser tratadas como strings YYYY-MM-DD
 * e convertidas para Date apenas quando necessário para exibição, usando o timezone local.
 */

/**
 * Converte uma Date para string no formato YYYY-MM-DD usando timezone local
 * Use esta função ao SALVAR datas no banco
 */
export function formatDateToISO(date: Date | undefined | null): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma string YYYY-MM-DD para Date preservando o dia correto (meia-noite local)
 * Use esta função ao LER datas do banco para exibição
 */
export function parseISOToDate(dateString: string | undefined | null): Date | undefined {
  if (!dateString) return undefined;
  
  // Remove qualquer parte de horário se existir
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Cria a data em meia-noite LOCAL (não UTC)
  return new Date(year, month - 1, day);
}

/**
 * Formata uma string de data YYYY-MM-DD para exibição no formato brasileiro DD/MM/YYYY
 * Use esta função para exibir datas em tabelas, cards, etc.
 */
export function formatDateBR(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  
  return `${day}/${month}/${year}`;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD (timezone local)
 */
export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

/**
 * Adiciona meses a uma data (string YYYY-MM-DD) e retorna nova string YYYY-MM-DD
 */
export function addMonthsToDate(dateString: string, months: number): string {
  const date = parseISOToDate(dateString);
  if (!date) return dateString;
  
  date.setMonth(date.getMonth() + months);
  return formatDateToISO(date);
}

/**
 * Adiciona dias a uma data (string YYYY-MM-DD) e retorna nova string YYYY-MM-DD
 */
export function addDaysToDate(dateString: string, days: number): string {
  const date = parseISOToDate(dateString);
  if (!date) return dateString;
  
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
}

/**
 * Calcula a diferença em dias entre duas datas (strings YYYY-MM-DD)
 */
export function diffInDays(dateString1: string, dateString2: string): number {
  const date1 = parseISOToDate(dateString1);
  const date2 = parseISOToDate(dateString2);
  
  if (!date1 || !date2) return 0;
  
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o primeiro dia do mês de uma data
 */
export function getFirstDayOfMonth(dateString: string): string {
  const date = parseISOToDate(dateString);
  if (!date) return dateString;
  
  date.setDate(1);
  return formatDateToISO(date);
}

/**
 * Retorna o último dia do mês de uma data
 */
export function getLastDayOfMonth(dateString: string): string {
  const date = parseISOToDate(dateString);
  if (!date) return dateString;
  
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return formatDateToISO(date);
}

/**
 * Verifica se a data está vencida (anterior a hoje)
 */
export function isOverdue(dateString: string): boolean {
  const today = getTodayISO();
  return dateString < today;
}

/**
 * Verifica se a data é hoje
 */
export function isToday(dateString: string): boolean {
  const today = getTodayISO();
  return dateString === today;
}
