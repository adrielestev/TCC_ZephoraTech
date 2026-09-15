import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Heights, BorderRadius, FontSizes, FontWeights, Spacing, Responsive } from '../theme/constants';

export const Button = ({ title, onPress, loading, type = 'primary', style }) => {
  const isPrimary = type === 'primary';
  const isOutline = type === 'outline';
  const isText = type === 'text';

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isText && styles.textBtn,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : Colors.primary} size="small" />
      ) : (
        <Text style={[
          styles.textBase,
          isPrimary && styles.textPrimary,
          isOutline && styles.textOutline,
          isText && styles.textText
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: Heights.button,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  textBtn: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingHorizontal: 0,
    marginVertical: Spacing.xs,
  },
  textBase: {
    fontSize: Responsive.isSmallScreen ? FontSizes.md : FontSizes.lg,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: Colors.primary,
  },
  textText: {
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
    fontSize: Responsive.isSmallScreen ? FontSizes.md : FontSizes.lg,
  }
});
