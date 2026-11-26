// src/app/(app)/_layout.tsx -- Define a navegação empilhada das telas disponíveis após a autenticação.
import { Stack } from 'expo-router';
import { useAuth } from '@/core/auth/AuthProvider';
import { colors, fonts } from '@/ui/theme';

export default function AppLayout() {
  const { isAdmin } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="rooms/[roomId]/index" options={{ title: 'Sala' }} />

      {/* Telas só do admin: usuário comum que tentar abrir volta ao início */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="rooms/new" options={{ title: 'Nova sala' }} />
        <Stack.Screen name="rooms/[roomId]/edit" options={{ title: 'Editar sala' }} />
        <Stack.Screen name="rooms/[roomId]/access" options={{ title: 'Quem tem acesso' }} />
        <Stack.Screen name="rooms/[roomId]/devices/[deviceId]" options={{ title: 'Aparelho' }} />
        <Stack.Screen name="rooms/[roomId]/automations/new" options={{ title: 'Nova automação' }} />
        <Stack.Screen
          name="rooms/[roomId]/automations/[automationId]"
          options={{ title: 'Automação' }}
        />
        <Stack.Screen name="admin/users/index" options={{ title: 'Usuários' }} />
        <Stack.Screen name="admin/users/[userId]" options={{ title: 'Usuário' }} />
        <Stack.Screen name="admin/esp32/index" options={{ title: 'Módulos ESP32' }} />
        <Stack.Screen name="admin/esp32/new" options={{ title: 'Cadastrar módulo' }} />
        <Stack.Screen name="admin/esp32/[esp32Id]" options={{ title: 'Módulo ESP32' }} />
      </Stack.Protected>
    </Stack>
  );
}
