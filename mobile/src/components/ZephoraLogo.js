import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LogoIcon from '../../assets/Logo-zephora.svg';
import {
  Colors,
  Heights,
  Spacing,
  FontSizes,
  FontWeights,
} from '../theme/constants';
import { useResponsive } from '../hooks/useResponsive';

export const ZephoraLogo = ({
  size = Heights.logo,
  style,
  variant = 'badge',
}) => {
  const { isSmallScreen } = useResponsive();

  if (variant === 'wordmark') {
    const wordmarkHeight = size * 0.6;
    return (
      <View style={[styles.wordmarkRow, style]}>
        <Text
          style={[
            styles.wordmarkText,
            { fontSize: isSmallScreen ? FontSizes.xxl : FontSizes.xxxl },
          ]}
        >
          Zephora
        </Text>
        <LogoIcon
          width={wordmarkHeight * 1.4}
          height={wordmarkHeight}
          color={Colors.text.primary}
        />
      </View>
    );
  }

  const svgSize = size * 0.7;
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <LogoIcon width={svgSize} height={svgSize * 0.7} color="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontWeight: FontWeights.extrabold,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginRight: Spacing.sm,
  },
});
