import type { TextStyle } from 'react-native';
import { fonts } from './fonts';

export const fontSize = { caption: 13, body: 16, bodyLg: 18, title: 22, display: 28 } as const;

/** Rampa tipográfica: as telas usam <AppText variant="..."> e nunca definem fontSize nem fontFamily. */
export const type = {
  display: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.display,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSize.title, lineHeight: 28, letterSpacing: -0.3 },
  heading: {
    fontFamily: fonts.bold,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: { fontFamily: fonts.regular, fontSize: fontSize.body, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: fontSize.body, lineHeight: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: fontSize.caption, lineHeight: 18 },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof type;
