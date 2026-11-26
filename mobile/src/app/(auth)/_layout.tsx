// src/app/(auth)/_layout.tsx -- Configura a navegação empilhada das telas de autenticação.
import { Stack } from 'expo-router';
import { colors } from '@/ui/theme';

// Ao sair da conta (ou abrir o app deslogado), a base da pilha é o login
export const unstable_settings = { anchor: 'login' };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
