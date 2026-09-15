import { useWindowDimensions, Platform } from 'react-native';

/**
 * Breakpoints reativos para Android, iOS e Web.
 * Ao contrário das constantes estáticas em `theme/constants.js` (calculadas uma
 * única vez a partir de `Dimensions.get('window')`), este hook usa
 * `useWindowDimensions`, então a UI se realinha automaticamente quando a
 * janela do navegador é redimensionada ou o dispositivo gira.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;
  const isWeb = Platform.OS === 'web';

  return {
    width,
    height,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isWeb,
    horizontalPadding: isSmallScreen ? 16 : 20,
    // Em telas grandes (tablet/web), o formulário fica centralizado em um
    // cartão com largura confortável de leitura, em vez de esticar por toda
    // a viewport.
    contentMaxWidth: isLargeScreen ? 440 : '100%',
  };
}
