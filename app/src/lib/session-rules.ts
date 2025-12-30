/**
 * Regras de negócio para sessões
 */

/**
 * Normaliza uma data para o início do dia (00:00:00) no timezone de São Paulo
 */
function normalizeDateToStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  // Força timezone de São Paulo (UTC-3)
  const saoPauloOffset = -3 * 60; // minutos
  const localOffset = normalized.getTimezoneOffset(); // minutos
  const diff = saoPauloOffset - localOffset;

  normalized.setHours(0, 0, 0, 0);
  normalized.setMinutes(normalized.getMinutes() + diff);

  return normalized;
}

/**
 * Verifica se uma sessão permite marcação de presença
 * Regra: Só pode marcar presença se a sessão JÁ ACONTECEU (dataSessao <= hoje)
 *
 * @param sessionDate - Data da sessão
 * @param now - Data atual (opcional, usa Date.now() se não fornecido)
 * @returns true se permite marcar presença, false caso contrário
 */
export function canMarkAttendance(sessionDate: Date | string, now?: Date): boolean {
  const sessaoDate = typeof sessionDate === 'string' ? new Date(sessionDate) : sessionDate;
  const currentDate = now ? new Date(now) : new Date();

  // Normalizar ambas as datas para início do dia
  const sessaoNormalized = normalizeDateToStartOfDay(sessaoDate);
  const todayNormalized = normalizeDateToStartOfDay(currentDate);

  // Só permite se a sessão JÁ ACONTECEU (menor ou igual a hoje)
  return sessaoNormalized.getTime() <= todayNormalized.getTime();
}

/**
 * Retorna mensagem de erro quando não pode marcar presença
 */
export function getAttendanceBlockedMessage(): string {
  return "Sessão ainda não aconteceu. Só é possível marcar presença em sessões que já ocorreram.";
}

/**
 * Retorna código de erro quando não pode marcar presença
 */
export function getAttendanceBlockedCode(): string {
  return "SESSION_NOT_HAPPENED_YET";
}
