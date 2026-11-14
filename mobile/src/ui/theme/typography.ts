import type { TextStyle } from 'react-native';

export const fontSize = { caption: 13, body: 16, bodyLg: 18, title: 22, display: 28 } as const;

/** Rampa tipográfica: as telas usam <AppText variant="..."> e nunca definem fontSize. */
export const type = {
  display: { fontSize: fontSize.display, fontWeight: '700', lineHeight: 34, letterSpacing: -0.4 },
  title: { fontSize: fontSize.title, fontWeight: '700', lineHeight: 28, letterSpacing: -0.2 },
  heading: { fontSize: fontSize.bodyLg, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: fontSize.body, lineHeight: 22 },
  bodyStrong: { fontSize: fontSize.body, fontWeight: '600', lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: fontSize.caption, lineHeight: 18 },
  overline: { fontSize: 12, fontWeight: '700', lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof type;
