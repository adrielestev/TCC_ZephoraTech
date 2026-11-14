import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '@/core/auth/AuthProvider';
import { queryClient, setupFocusManager } from '@/core/query/queryClient';
import { FeedbackProvider } from '@/ui/Feedback';
import { BrandMark } from '@/ui/BrandMark';
import { colors, spacing } from '@/ui/theme';

function Splash() {
  return (
    <View style={styles.splash} accessibilityLabel="Carregando o Zephora">
      <BrandMark size={72} />
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  // Splash: enquanto a sessão é restaurada (GET /auth/me) o navegador nem é montado.
  // Assim as guardas já nascem corretas e links diretos (ex.: /rooms/1) são preservados.
  if (status === 'loading') return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => setupFocusManager(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FeedbackProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </FeedbackProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
