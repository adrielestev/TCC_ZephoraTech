import React from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../theme/constants';
import { useResponsive } from '../hooks/useResponsive';

export const Screen = ({ children, scrollable = false, gradient = true, style, contentMaxWidth }) => {
  const { horizontalPadding, contentMaxWidth: autoMaxWidth } = useResponsive();
  const maxWidth = contentMaxWidth ?? autoMaxWidth;

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: horizontalPadding }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.contentWrapper, { maxWidth }]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.contentWrapper, { maxWidth }]}>{children}</View>
    </View>
  );

  const body = (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.innerContent, style]}>{content}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  if (!gradient) {
    return <View style={[styles.safeArea, { backgroundColor: Colors.background }]}>{body}</View>;
  }

  return (
    <LinearGradient
      colors={Colors.gradient.background}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.safeArea}
    >
      {body}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl,
  },
  contentWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
});
