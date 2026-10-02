type UnknownError = unknown;

function messageOf(error: UnknownError): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message ?? '');
  }
  return String(error);
}

/** Mensagens amigáveis — detalhes técnicos só em __DEV__. */
export function mapErrorToUserMessage(error: UnknownError): string {
  const raw = messageOf(error).toLowerCase();

  if (__DEV__) {
    console.warn('[Equilibrium]', messageOf(error));
  }

  if (
    raw.includes('network request failed') ||
    raw.includes('failed to fetch') ||
    raw.includes('offline') ||
    raw.includes('networkerror')
  ) {
    return 'Não foi possível salvar agora. Verifique sua conexão.';
  }

  if (raw.includes('invalid login credentials') || raw.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (raw.includes('user already registered') || raw.includes('already been registered')) {
    return 'Este e-mail já possui uma conta.';
  }

  if (raw.includes('email not confirmed')) {
    return 'Confirme seu e-mail para continuar.';
  }

  if (raw.includes('password') && raw.includes('weak')) {
    return 'Escolha uma senha mais forte (mínimo 6 caracteres).';
  }

  if (raw.includes('jwt') || raw.includes('session') || raw.includes('refresh')) {
    return 'Sua sessão expirou. Entre novamente.';
  }

  if (raw.includes('pgrst') || raw.includes('postgrest') || raw.includes('22p02')) {
    return 'Não conseguimos carregar seus dados agora.';
  }

  if (raw.includes('not_authenticated')) {
    return 'Você precisa entrar na sua conta.';
  }

  return 'Algo deu errado. Tente novamente em instantes.';
}

export class AppError extends Error {
  readonly userMessage: string;

  constructor(cause: UnknownError, fallback?: string) {
    const userMessage = fallback ?? mapErrorToUserMessage(cause);
    super(userMessage);
    this.name = 'AppError';
    this.userMessage = userMessage;
  }
}
