// src/core/format.ts -- Converte datas recebidas da API e formata o horário da última atividade.
/** Datas da API vêm em UTC no formato "YYYY-MM-DD HH:MM:SS". */
export function parseApiDate(value: string): Date {
  return new Date(`${value.replace(' ', 'T')}Z`);
}

export function formatLastSeen(value: string | null): string {
  if (!value) return 'ainda não conectou';
  const seconds = Math.max(0, Math.round((Date.now() - parseApiDate(value).getTime()) / 1000));
  if (seconds < 20) return 'agora mesmo';
  if (seconds < 60) return `há ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.round(hours / 24)} d`;
}
