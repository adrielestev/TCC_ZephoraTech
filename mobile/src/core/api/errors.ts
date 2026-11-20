import axios from 'axios';

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: { path: string; message: string }[] };
}

/** Mensagens amigáveis por código de erro da API. Sem código mapeado, usa a mensagem do servidor. */
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  EMAIL_NOT_VERIFIED: 'Verifique seu e-mail para entrar.',
  ACCOUNT_DISABLED: 'Sua conta está desativada. Procure o administrador.',
  INVALID_CODE: 'Código inválido ou expirado. Confira os 6 dígitos ou peça um novo código.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde um instante e tente novamente.',
  VALIDATION_ERROR: 'Confira os dados informados.',
  ROOM_NAME_TAKEN: 'Já existe uma sala com esse nome.',
  ROOM_HAS_DEVICES: 'Remova ou mova os aparelhos da sala antes de excluí-la.',
  ESP32_ALREADY_REGISTERED: 'Esta credencial já está cadastrada.',
  ESP32_NOT_OPERATIONAL: 'O ESP32 ainda não está operacional. Ligue-o e aguarde a conexão.',
  DEVICE_IN_AUTOMATION: 'Remova o aparelho das automações antes de movê-lo de sala.',
  OWNER_PROTECTED: 'O admin padrão não pode ser alterado.',
  INVALID_IMAGE: 'Imagem inválida. Use JPEG, PNG ou WebP.',
  UPLOAD_ERROR: 'Não foi possível enviar a imagem. Ela deve ter no máximo 5 MB.',
  ROOM_NOT_FOUND: 'Sala não encontrada.',
  DEVICE_NOT_FOUND: 'Aparelho não encontrado.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
};

export function getErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError<ApiErrorBody>(error)) return error.response?.data?.error?.code;
  return undefined;
}

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response)
      return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
    const code = error.response.data?.error?.code;
    if (code && MESSAGES[code]) return MESSAGES[code];
    return error.response.data?.error?.message ?? 'Algo deu errado. Tente novamente.';
  }
  return 'Algo deu errado. Tente novamente.';
}
