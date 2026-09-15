import React, { useRef, useState } from 'react';
import { TextInput, View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Colors, Heights, BorderRadius, FontSizes, FontWeights, Spacing } from '../theme/constants';
import { useResponsive } from '../hooks/useResponsive';

export const Input = ({ label, error, onFocus, onBlur, style, ...props }) => {
  const { isSmallScreen } = useResponsive();
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e) => {
    setFocused(true);
    Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = error
    ? Colors.error
    : focusAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.border, Colors.primary] });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.inputFill, Colors.inputFillFocused],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { fontSize: isSmallScreen ? FontSizes.sm : FontSizes.md }]}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          { height: Heights.input, paddingHorizontal: isSmallScreen ? Spacing.md : Spacing.lg, borderColor, backgroundColor },
          focused && styles.inputFocusedShadow,
        ]}
      >
        <TextInput
          style={[styles.input, { fontSize: isSmallScreen ? FontSizes.md : FontSizes.lg }, Platform.OS === 'web' && styles.inputWeb, style]}
          placeholderTextColor={Colors.text.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  label: {
    color: Colors.text.secondary,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  inputFocusedShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    color: Colors.text.primary,
    flex: 1,
    fontWeight: FontWeights.medium,
  },
  inputWeb: {
    outlineStyle: 'none',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    fontWeight: FontWeights.medium,
  },
});
