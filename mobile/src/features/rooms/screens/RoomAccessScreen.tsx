import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import { routes } from '@/core/navigation/routes';
import { RoleBadge } from '@/features/users/components';
import { Avatar } from '@/ui/Avatar';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { ListItem } from '@/ui/ListItem';
import { Screen } from '@/ui/Screen';
import { ListItemSkeleton, SkeletonList } from '@/ui/Skeleton';
import { EmptyState, QueryBoundary } from '@/ui/States';
import { spacing } from '@/ui/theme';
import { useRoomAccess } from '../hooks';

export default function RoomAccessScreen() {
  const router = useRouter();
  const roomId = useNumericParam('roomId');
  const access = useRoomAccess(roomId);

  return (
    <Screen width="form" onRefresh={() => void access.refetch()} refreshing={access.isRefetching && !access.isPending}>
      <Banner
        tone="info"
        message="Admins sempre acessam todas as salas. Aqui aparecem os usuários comuns com acesso a esta sala."
      />
      <QueryBoundary
        query={access}
        skeleton={<SkeletonList count={3}>{() => <ListItemSkeleton />}</SkeletonList>}
      >
        {(users) =>
          users.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Nenhum usuário comum com acesso"
              message="Libere esta sala na tela do usuário."
              actionLabel="Ir para usuários"
              onAction={() => router.push(routes.users)}
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {users.map((user) => (
                <ListItem
                  key={user.id}
                  leading={<Avatar name={user.name} uri={user.avatarUrl} />}
                  title={user.name}
                  description={user.email}
                  accessibilityLabel={`Abrir ${user.name}`}
                  footer={<RoleBadge role={user.role} />}
                  onPress={() => router.push(routes.user(user.id))}
                />
              ))}
              <Button label="Gerenciar usuários" variant="outline" onPress={() => router.push(routes.users)} />
            </View>
          )
        }
      </QueryBoundary>
    </Screen>
  );
}
