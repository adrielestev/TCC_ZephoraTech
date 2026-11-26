// src/features/esp32/screens/Esp32DetailScreen.tsx -- Exibe o estado e os dispositivos associados a um módulo ESP32.
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { formatLastSeen } from '@/core/format';
import { routes } from '@/core/navigation/routes';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import type { Esp32Detail } from '@/core/types';
import { getDeviceTypeMeta } from '@/features/devices/deviceTypes';
import { useRooms } from '@/features/rooms/hooks';
import { AppText } from '@/ui/AppText';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { useConfirm, useToast } from '@/ui/Feedback';
import { IconTile, ListItem } from '@/ui/ListItem';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { QueryBoundary } from '@/ui/States';
import { spacing } from '@/ui/theme';
import { Esp32StatusBadge, esp32Tone } from '../components';
import { useEsp32, useRemoveEsp32 } from '../hooks';

export default function Esp32DetailScreen() {
  const id = useNumericParam('esp32Id');
  const module_ = useEsp32(id, true);
  return (
    <Screen
      width="form"
      onRefresh={() => void module_.refetch()}
      refreshing={module_.isRefetching && !module_.isPending}
    >
      <QueryBoundary query={module_}>{(data) => <Detail module_={data} />}</QueryBoundary>
    </Screen>
  );
}

function Detail({ module_ }: { module_: Esp32Detail }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const rooms = useRooms();
  const remove = useRemoveEsp32();

  const registered = module_.devices.filter((d) => d.registrationStatus === 'registered');
  const discovered = module_.devices.filter((d) => d.registrationStatus === 'discovered');
  const roomName = (id: number | null) =>
    rooms.data?.find((r) => r.id === id)?.name ?? 'Sala removida';

  const removeModule = async () => {
    const ok = await confirm({
      title: 'Remover módulo?',
      message:
        'Os aparelhos dele serão descadastrados e as automações que dependem deles serão removidas.',
      confirmLabel: 'Remover módulo',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(module_.id);
      toast('Módulo removido.', 'success');
      router.back();
    } catch (error) {
      toast(getErrorMessage(error), 'danger');
    }
  };

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconTile name="hardware-chip-outline" tone={esp32Tone[module_.status]} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title">{module_.name ?? `Módulo ${module_.id}`}</AppText>
            <AppText variant="caption" color="textMuted">
              Credencial …{module_.credentialHint ?? '----'}
              {module_.firmwareVersion ? ` · firmware ${module_.firmwareVersion}` : ''}
            </AppText>
          </View>
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}
        >
          <Esp32StatusBadge status={module_.status} />
          <AppText variant="caption" color="textMuted">
            Última conexão: {formatLastSeen(module_.lastSeenAt)}
          </AppText>
        </View>
      </Card>

      {discovered.length > 0 ? (
        <Card>
          <Badge
            label={`${discovered.length} aparelho(s) novo(s) reportado(s)`}
            tone="admin"
            icon="sparkles-outline"
          />
          <Button
            label="Adicionar aparelhos novos"
            icon="add-circle-outline"
            onPress={() => router.push(routes.addEsp32Devices(module_.id))}
            disabled={module_.status !== 'online'}
          />
          {module_.status !== 'online' ? (
            <AppText variant="caption" color="textMuted">
              O módulo precisa estar online para cadastrar aparelhos.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <Section title="Aparelhos cadastrados" count={registered.length}>
        {registered.length === 0 ? (
          <AppText color="textMuted">Nenhum aparelho cadastrado neste módulo ainda.</AppText>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {registered.map((d) => (
              <ListItem
                key={d.id}
                leading={<IconTile name={getDeviceTypeMeta(d.type).icon} size={44} />}
                title={d.name}
                description={`${getDeviceTypeMeta(d.type).label} · ${roomName(d.roomId)}`}
              />
            ))}
          </View>
        )}
      </Section>

      <Section title="Zona de risco">
        <Button
          label="Remover módulo"
          variant="danger"
          icon="trash-outline"
          onPress={removeModule}
          loading={remove.isPending}
        />
      </Section>
    </>
  );
}
