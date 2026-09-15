import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { Colors, Heights, BorderRadius, FontSizes, FontWeights, Spacing, Responsive } from '../theme/constants';

export const Input = ({ label, error, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput 
          style={styles.input} 
          placeholderTextColor={Colors.text.placeholder}
          {...props} 
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Responsive.isSmallScreen ? Spacing.lg : Spacing.xl,
    width: '100%',
  },
  label: {
    fontSize: Responsive.isSmallScreen ? FontSizes.sm : FontSizes.md,
    color: Colors.text.secondary,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Responsive.isSmallScreen ? Spacing.md : Spacing.lg,
    height: Heights.input,
    justifyContent: 'center',
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    fontSize: Responsive.isSmallScreen ? FontSizes.md : FontSizes.lg,
    color: Colors.text.primary,
    flex: 1,
    fontWeight: FontWeights.medium,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    fontWeight: FontWeights.medium,
  }
});
