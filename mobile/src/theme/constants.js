import { Dimensions } from 'react-native';

// Responsividade
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

// Cores do tema Zephora
export const Colors = {
  // Primary — tom aproximado do azul de referência do login
  primary: '#5B8DEF',
  primaryDark: '#3E6FD1',
  primaryLight: '#8CB0F5',

  // Secondary colors por contexto
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#8B5CF6',

  // Neutros
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    placeholder: '#94A3B8',
  },

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Shadows
  shadow: {
    color: '#000000',
    opacity: 0.1,
  },

  // Campos de formulário (preenchidos, sem borda pesada)
  inputFill: '#F0F4FA',
  inputFillFocused: '#FFFFFF',

  // Gradientes usados nas telas de autenticação
  gradient: {
    background: ['#f6f7f9', '#e3ebf7', '#C7D9F2'],
    card: ['#FDFEFF', '#EEF2F8'],
    button: ['#729AF0', '#4D7BE0'],
  },
};

// Espaçamentos
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

// Tamanhos de borda
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Tamanhos de fonte
export const FontSizes = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  huge: 36,
};

// Pesos de fonte
export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// Alturas de componentes
export const Heights = {
  input: isSmallScreen ? 50 : 56,
  button: isSmallScreen ? 50 : 56,
  logo: isSmallScreen ? 70 : 80,
};

// Configurações responsivas
export const Responsive = {
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  screenWidth: width,
  screenHeight: height,
  horizontalPadding: isSmallScreen ? 16 : 20,
  maxWidth: isLargeScreen ? 600 : '100%',
};

// Configurações de animação
export const Animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Configurações de navegação
export const Navigation = {
  headerShown: false,
  animationType: 'slide_from_right',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: 'easeInOut',
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: 'easeInOut',
      },
    },
  },
};
