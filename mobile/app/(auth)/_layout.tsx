import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Voltar",
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.ink, fontWeight: "800" },
        headerStyle: { backgroundColor: colors.surfaceMuted },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Criar conta" }} />
      <Stack.Screen name="verify-email" options={{ title: "Verificar e-mail" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Recuperar senha" }} />
      <Stack.Screen name="reset-password" options={{ title: "Redefinir senha" }} />
    </Stack>
  );
}
