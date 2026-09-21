import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export const Colors = {
  primary: '#5B8DEF',
  primaryDark: '#3E6FD1',
  primaryLight: '#8CB0F5',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#8B5CF6',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    placeholder: '#94A3B8',
  },

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  shadow: {
    color: '#000000',
    opacity: 0.1,
  },

  inputFill: '#F0F4FA',
  inputFillFocused: '#FFFFFF',

  gradient: {
    background: ['#f6f7f9', '#e3ebf7', '#C7D9F2'],
    card: ['#FDFEFF', '#EEF2F8'],
    button: ['#729AF0', '#4D7BE0'],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

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

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const Heights = {
  input: isSmallScreen ? 50 : 56,
  button: isSmallScreen ? 50 : 56,
  logo: isSmallScreen ? 70 : 80,
};
