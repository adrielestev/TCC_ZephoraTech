import React from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { Colors, Spacing, Responsive } from '../theme/constants';

const { width } = Dimensions.get('window');

export const Screen = ({ children, scrollable = false, style }) => {
  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.innerContent, style]}>
          {content}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Responsive.horizontalPadding,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Responsive.horizontalPadding,
    paddingBottom: Spacing.xxxl,
  },
  contentWrapper: {
    maxWidth: Responsive.maxWidth,
    alignSelf: 'center',
    width: '100%',
  }
});
