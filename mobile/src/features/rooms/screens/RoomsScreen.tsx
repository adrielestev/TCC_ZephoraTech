import { useRouter } from 'expo-router';
import { useAuth } from '@/core/auth/AuthProvider';
import { routes } from '@/core/navigation/routes';
import { Button } from '@/ui/Button';
import { Grid } from '@/ui/Grid';
import { PageHeader } from '@/ui/PageHeader';
import { Screen } from '@/ui/Screen';
import { RoomCardSkeleton, SkeletonList } from '@/ui/Skeleton';
import { EmptyState, QueryBoundary } from '@/ui/States';
import { RoomCard } from '../components/RoomCard';
import { useRooms } from '../hooks';

export default function RoomsScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const rooms = useRooms();
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <Screen width="wide" onRefresh={() => void rooms.refetch()} refreshing={rooms.isRefetching && !rooms.isPending}>
      <PageHeader
        eyebrow={`Olá, ${firstName}`}
        title="Salas"
        description="Escolha uma sala para ligar aparelhos e controlar automações."
        action={
          isAdmin ? <Button label="Nova sala" icon="add" size="sm" fullWidth={false} onPress={() => router.push(routes.newRoom)} /> : undefined
        }
      />

      <QueryBoundary
        query={rooms}
        skeleton={
          <SkeletonList count={3}>
            {() => <RoomCardSkeleton />}
          </SkeletonList>
        }
      >
        {(list) =>
          list.length === 0 ? (
            isAdmin ? (
              <EmptyState
                icon="school-outline"
                title="Nenhuma sala criada ainda"
                message="Crie a primeira sala para organizar os aparelhos da escola."
                actionLabel="Criar primeira sala"
                onAction={() => router.push(routes.newRoom)}
              />
            ) : (
              <EmptyState
                icon="lock-closed-outline"
                title="Você ainda não tem acesso a nenhuma sala"
                message="Peça a um administrador para liberar uma sala para você. Depois, puxe a tela para baixo para atualizar."
              />
            )
          ) : (
            <Grid minItemWidth={300}>
              {list.map((room) => (
                <RoomCard key={room.id} room={room} onPress={() => router.push(routes.room(room.id))} />
              ))}
            </Grid>
          )
        }
      </QueryBoundary>
    </Screen>
  );
}
