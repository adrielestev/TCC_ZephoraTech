import React, { useRef } from 'react';
import { Text, ActivityIndicator, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Heights, BorderRadius, FontSizes, FontWeights, Spacing } from '../theme/constants';
import { useResponsive } from '../hooks/useResponsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export const Button = ({ title, onPress, loading, type = 'primary', underline = false, style }) => {
  const { isSmallScreen } = useResponsive();
  const isPrimary = type === 'primary';
  const isOutline = type === 'outline';
  const isText = type === 'text';
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const textStyle = [
    styles.textBase,
    { fontSize: isSmallScreen ? FontSizes.md : FontSizes.lg },
    isPrimary && styles.textPrimary,
    isOutline && styles.textOutline,
    isText && styles.textText,
    underline && styles.textUnderline,
  ];

  const webPointer = Platform.OS === 'web' ? { cursor: loading ? 'default' : 'pointer' } : null;

  if (isPrimary) {
    return (
      <AnimatedGradient
        colors={Colors.gradient.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, styles.primaryShadow, { height: Heights.button, transform: [{ scale }] }, style, webPointer]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={loading}
          style={styles.pressableFill}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={textStyle}>{title}</Text>
          )}
        </Pressable>
      </AnimatedGradient>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={loading}
      style={[
        styles.base,
        isOutline && styles.outline,
        isText && styles.textBtn,
        { transform: [{ scale }] },
        isOutline && { height: Heights.button },
        style,
        webPointer,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
    width: '100%',
  },
  pressableFill: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
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
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.3,
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
  },
  textUnderline: {
    textDecorationLine: 'underline',
  },
});
