import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../theme/constants';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Cartão de vidro/gradiente usado como superfície principal das telas de
 * autenticação, no estilo da referência de design do login.
 */
export const AuthCard = ({ children, style }) => {
  const { isSmallScreen } = useResponsive();

  return (
    <LinearGradient
      colors={Colors.gradient.card}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.card, { padding: isSmallScreen ? Spacing.xl : Spacing.xxl }, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: BorderRadius.xl + 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
});
