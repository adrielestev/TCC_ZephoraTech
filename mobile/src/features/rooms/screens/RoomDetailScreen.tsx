// src/features/rooms/screens/RoomDetailScreen.tsx -- Reúne os detalhes, dispositivos e automações de uma sala selecionada.
import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { useAuth } from '@/core/auth/AuthProvider';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import { routes } from '@/core/navigation/routes';
import { AutomationCard } from '@/features/automations/components/AutomationCard';
import { usePauseAutomation, useRoomAutomations } from '@/features/automations/hooks';
import { DeviceCard } from '@/features/devices/components/DeviceCard';
import { buildState } from '@/features/devices/deviceTypes';
import { useRoomDevices, useSetDeviceState } from '@/features/devices/hooks';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { useToast } from '@/ui/Feedback';
import { Grid } from '@/ui/Grid';
import { IconTile, ListItem } from '@/ui/ListItem';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { ListItemSkeleton, SkeletonList } from '@/ui/Skeleton';
import { EmptyState, ErrorView } from '@/ui/States';
import { spacing } from '@/ui/theme';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { useRoom } from '../hooks';

export default function RoomDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const roomId = useNumericParam('roomId');

  const room = useRoom(roomId);
  const devices = useRoomDevices(roomId);
  const automations = useRoomAutomations(roomId);
  const setState = useSetDeviceState(roomId);
  const pause = usePauseAutomation(roomId);

  const refresh = () => {
    void room.refetch();
    void devices.refetch();
    void automations.refetch();
  };

  const skeleton = <SkeletonList count={2}>{() => <ListItemSkeleton />}</SkeletonList>;

  return (
    <Screen width="wide" onRefresh={refresh} refreshing={room.isRefetching && !room.isPending}>
      <Stack.Screen options={{ title: room.data?.name ?? 'Sala' }} />

      {room.data ? (
        <View style={{ gap: spacing.md }}>
          <PhotoCarousel photos={room.data.photos} />
          {room.data.description ? (
            <AppText color="textMuted">{room.data.description}</AppText>
          ) : null}
        </View>
      ) : room.isError ? (
        <ErrorView error={room.error} onRetry={() => void room.refetch()} />
      ) : null}

      <Section
        title="Aparelhos"
        count={devices.data?.length}
        description="Use o interruptor para ligar ou desligar."
      >
        {devices.isPending ? (
          skeleton
        ) : devices.isError ? (
          <ErrorView error={devices.error} onRetry={() => void devices.refetch()} />
        ) : devices.data.length === 0 ? (
          <EmptyState
            icon="hardware-chip-outline"
            title="Nenhum aparelho nesta sala"
            message={
              isAdmin
                ? 'Cadastre um módulo ESP32 e escolha esta sala para os aparelhos dele.'
                : 'Um administrador ainda não cadastrou aparelhos aqui.'
            }
            actionLabel={isAdmin ? 'Cadastrar módulo ESP32' : undefined}
            onAction={isAdmin ? () => router.push(routes.newEsp32) : undefined}
          />
        ) : (
          <Grid minItemWidth={320} gap={spacing.md}>
            {devices.data.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onToggle={(value) =>
                  setState.mutate(
                    { id: device.id, state: buildState(device.type, value) },
                    { onError: (error) => toast(getErrorMessage(error), 'danger') },
                  )
                }
                onManage={isAdmin ? () => router.push(routes.device(roomId, device.id)) : undefined}
              />
            ))}
          </Grid>
        )}
      </Section>

      <Section
        title="Automações"
        count={automations.data?.length}
        description="Pause uma automação para ela não disparar até você ativar de novo."
        action={
          isAdmin ? (
            <Button
              label="Nova"
              icon="add"
              size="sm"
              variant="outline"
              fullWidth={false}
              onPress={() => router.push(routes.newAutomation(roomId))}
            />
          ) : undefined
        }
      >
        {automations.isPending ? (
          skeleton
        ) : automations.isError ? (
          <ErrorView error={automations.error} onRetry={() => void automations.refetch()} />
        ) : automations.data.length === 0 ? (
          <AppText color="textMuted">
            {isAdmin
              ? 'Nenhuma automação ainda. Toque em "Nova" para criar a primeira.'
              : 'Nenhuma automação nesta sala.'}
          </AppText>
        ) : (
          <Grid minItemWidth={420} gap={spacing.md}>
            {automations.data.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                devices={devices.data ?? []}
                onPauseChange={(paused) =>
                  pause.mutate(
                    { id: automation.id, paused },
                    {
                      onSuccess: () =>
                        toast(paused ? 'Automação pausada.' : 'Automação ativada.', 'success'),
                      onError: (error) => toast(getErrorMessage(error), 'danger'),
                    },
                  )
                }
                onManage={
                  isAdmin ? () => router.push(routes.automation(roomId, automation.id)) : undefined
                }
              />
            ))}
          </Grid>
        )}
      </Section>

      {isAdmin ? (
        <Section title="Administração da sala">
          <ListItem
            leading={<IconTile name="people-outline" tone="primary" />}
            title="Quem tem acesso"
            description="Usuários comuns liberados para esta sala."
            onPress={() => router.push(routes.roomAccess(roomId))}
          />
          <ListItem
            leading={<IconTile name="create-outline" tone="primary" />}
            title="Editar sala e fotos"
            description="Nome, descrição, até 3 fotos e exclusão."
            onPress={() => router.push(routes.editRoom(roomId))}
          />
        </Section>
      ) : null}
    </Screen>
  );
}
