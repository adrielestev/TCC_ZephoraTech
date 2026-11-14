/**
 * Paleta do Zephora. Inspirada nos tokens do shadcn/ui (background, card, muted, border, ring):
 * superfícies neutras e frias, com o teal da marca como único acento.
 */
export const colors = {
  // marca
  primary: '#0E7490',
  primaryDark: '#155E75',
  primarySoft: '#D5F3F8',
  onPrimary: '#FFFFFF',

  // superfícies
  bg: '#F4F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF2F5',

  // linhas
  border: '#DCE5EB',
  borderStrong: '#C3D0D9',

  // texto
  text: '#0F2A37',
  textMuted: '#58707F',
  disabled: '#B8C4CE',

  // semânticas
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  success: '#1B7F52',
  successSoft: '#E1F5EB',
  warning: '#9A6200',
  warningSoft: '#FFF3D6',

  // papéis
  admin: '#A04A00',
  adminSoft: '#FDEBD8',
  owner: '#5B3FC4',
  ownerSoft: '#ECE7FC',

  // foco e sobreposição
  ring: 'rgba(14, 116, 144, 0.30)',
  ringDanger: 'rgba(180, 35, 24, 0.25)',
  overlay: 'rgba(15, 42, 55, 0.5)',
} as const;

export type ColorName = keyof typeof colors;
