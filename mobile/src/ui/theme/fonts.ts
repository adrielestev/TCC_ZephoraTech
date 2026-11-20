import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

/** Nomes das famílias por peso (com fontes customizadas não se usa `fontWeight`). */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Mapa entregue ao `useFonts` no layout raiz. */
export const fontAssets = {
  [fonts.regular]: PlusJakartaSans_400Regular,
  [fonts.medium]: PlusJakartaSans_500Medium,
  [fonts.semibold]: PlusJakartaSans_600SemiBold,
  [fonts.bold]: PlusJakartaSans_700Bold,
  [fonts.extrabold]: PlusJakartaSans_800ExtraBold,
};
