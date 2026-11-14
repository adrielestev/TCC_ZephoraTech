import { Stack, useRouter } from 'expo-router';
import { routes } from '@/core/navigation/routes';
import { Screen } from '@/ui/Screen';
import { EmptyState } from '@/ui/States';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen centered>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <EmptyState
        icon="compass-outline"
        title="Página não encontrada"
        message="O endereço não existe ou você não tem acesso a ele."
        actionLabel="Ir para o início"
        onAction={() => router.replace(routes.home)}
      />
    </Screen>
  );
}
