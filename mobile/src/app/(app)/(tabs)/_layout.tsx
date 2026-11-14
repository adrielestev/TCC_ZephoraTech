import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { AppTabBar } from '@/features/shell/components/AppTabBar';
import { colors, WIDE_BREAKPOINT } from '@/ui/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { isAdmin } = useAuth();
  const wide = width >= WIDE_BREAKPOINT; // web e tablets: menu lateral

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} wide={wide} />}
      screenOptions={{
        // cada tela desenha o próprio PageHeader (sem título duplicado do navegador)
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Salas' }} />
      {/* Aba "Administração": só existe para admin (fluxo 2 do fluxograma) */}
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen name="admin" options={{ title: 'Administração' }} />
      </Tabs.Protected>
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
