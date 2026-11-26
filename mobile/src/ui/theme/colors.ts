// src/ui/theme/colors.ts -- Paleta do Zephora — "lousa inteligente": o azul-lousa da sala de aula (ink) como base escura,
/**
 * Paleta do Zephora — "lousa inteligente": o azul-lousa da sala de aula (ink) como base escura,
 * o azul-giz (primary) como acento de ação e o branco-giz (chalk) para rabiscos e textos sobre a lousa.
 * Superfícies claras levemente azuladas, como papel quadriculado.
 */
export const colors = {
  // marca
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primarySoft: '#DBEAFE',
  onPrimary: '#FFFFFF',

  // lousa (superfícies escuras: painel de login, menu lateral, cabeçalho das salas)
  ink: '#0B1B3F',
  inkRaised: '#14295E',
  chalk: '#EAF1FF',
  chalkMuted: '#B9CDF5',
  /** azul-claro de "sinal": indicador ativo e brilho sobre a lousa */
  sky: '#5BB5FF',

  // superfícies
  bg: '#F2F6FD',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EFFB',
  /** aparelho ligado: fundo do card */
  surfaceActive: '#F3F8FF',

  // linhas
  border: '#D7E2F4',
  borderStrong: '#B9CBE8',

  // texto
  text: '#0B1B3F',
  textMuted: '#51648A',
  disabled: '#A9B7D0',

  // semânticas
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  success: '#16794C',
  successSoft: '#E1F5EB',
  warning: '#9A6200',
  warningSoft: '#FFF3D6',

  // papéis
  admin: '#A04A00',
  adminSoft: '#FDEBD8',
  owner: '#5B3FC4',
  ownerSoft: '#ECE7FC',

  // foco e sobreposição
  ring: 'rgba(37, 99, 235, 0.28)',
  ringDanger: 'rgba(180, 35, 24, 0.25)',
  overlay: 'rgba(11, 27, 63, 0.55)',
  /** véu translúcido sobre a lousa (círculos de ícone, itens ativos do menu) */
  chalkVeil: 'rgba(234, 241, 255, 0.12)',
  chalkLine: 'rgba(234, 241, 255, 0.18)',
} as const;

/** Degradês da lousa (usados com expo-linear-gradient). */
export const gradients = {
  board: ['#1E3A8A', '#0B1B3F'],
  boardSoft: ['#2B55C4', '#14295E'],
} as const;

export type ColorName = keyof typeof colors;
