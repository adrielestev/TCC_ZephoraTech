import { useWindowDimensions, Platform } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  return {
    width,
    height,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isWeb: Platform.OS === 'web',
    horizontalPadding: isSmallScreen ? 16 : 20,
    contentMaxWidth: isLargeScreen ? 440 : '100%',
  };
}
