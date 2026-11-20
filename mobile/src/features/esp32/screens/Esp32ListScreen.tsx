import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { formatLastSeen } from '@/core/format';
import { routes } from '@/core/navigation/routes';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { IconTile, ListItem } from '@/ui/ListItem';
import { Screen } from '@/ui/Screen';
import { ListItemSkeleton, SkeletonList } from '@/ui/Skeleton';
import { EmptyState, QueryBoundary } from '@/ui/States';
import { spacing } from '@/ui/theme';
import { Esp32StatusBadge, esp32Tone } from '../components';
import { useEsp32List } from '../hooks';

export default function Esp32ListScreen() {
  const router = useRouter();
  const modules = useEsp32List();

  return (
    <Screen
      onRefresh={() => void modules.refetch()}
      refreshing={modules.isRefetching && !modules.isPending}
    >
      <Button label="Cadastrar módulo" icon="add" onPress={() => router.push(routes.newEsp32)} />

      <QueryBoundary
        query={modules}
        skeleton={<SkeletonList count={3}>{() => <ListItemSkeleton />}</SkeletonList>}
      >
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              icon="hardware-chip-outline"
              title="Nenhum módulo cadastrado"
              message="Cadastre o primeiro ESP32 para começar a controlar os aparelhos das salas."
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {list.map((m) => (
                <ListItem
                  key={m.id}
                  leading={<IconTile name="hardware-chip-outline" tone={esp32Tone[m.status]} />}
                  title={m.name ?? `Módulo ${m.id}`}
                  description={`Credencial …${m.credentialHint ?? '----'} · visto ${formatLastSeen(m.lastSeenAt)}`}
                  accessibilityLabel={`Abrir módulo ${m.name ?? m.id}`}
                  footer={
                    <>
                      <Esp32StatusBadge status={m.status} />
                      <Badge label={`${m.registeredDevices} cadastrados`} tone="neutral" />
                      {m.discoveredDevices > 0 ? (
                        <Badge
                          label={`${m.discoveredDevices} novos para cadastrar`}
                          tone="admin"
                          icon="sparkles-outline"
                        />
                      ) : null}
                    </>
                  }
                  onPress={() => router.push(routes.esp32(m.id))}
                />
              ))}
            </View>
          )
        }
      </QueryBoundary>
    </Screen>
  );
}
