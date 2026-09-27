import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Voltar",
        headerTintColor: "#2F6FAD",
        headerTitleStyle: { color: "#111827", fontWeight: "800" },
        headerStyle: { backgroundColor: "#F7F8FA" },
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
