// src/app/_layout.tsx -- Inicializa provedores, fontes e navegação global do aplicativo.
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '@/core/auth/AuthProvider';
import { queryClient, setupFocusManager } from '@/core/query/queryClient';
import { FeedbackProvider } from '@/ui/Feedback';
import { BrandMark } from '@/ui/BrandMark';
import { ChalkBoard } from '@/ui/ChalkBoard';
import { colors, fontAssets, spacing } from '@/ui/theme';

// Mantém o splash nativo até as fontes carregarem (evita o "pulo" de tipografia)
void SplashScreen.preventAutoHideAsync();

/** Tela de carregamento da sessão: mesma lousa do splash nativo, então a troca é imperceptível. */
function Splash() {
  return (
    <ChalkBoard style={styles.splash} anchor="center" chalk={0.35}>
      <View accessibilityLabel="Carregando o Zephora" style={styles.splashContent}>
        <StatusBar style="light" />
        <BrandMark size={84} tone="chalk" />
        <ActivityIndicator color={colors.chalk} />
      </View>
    </ChalkBoard>
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
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = fontsLoaded || !!fontError; // se a fonte falhar, segue com a fonte do sistema

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

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
  splash: { flex: 1 },
  splashContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
});
