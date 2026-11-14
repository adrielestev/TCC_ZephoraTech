import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/core/api/errors';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import type { Device } from '@/core/types';
import { RoomPicker } from '@/features/rooms/components/RoomPicker';
import { useRooms } from '@/features/rooms/hooks';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { useConfirm, useToast } from '@/ui/Feedback';
import { FormField } from '@/ui/FormField';
import { Screen } from '@/ui/Screen';
import { IconTile } from '@/ui/ListItem';
import { spacing } from '@/ui/theme';
import { EmptyState, LoadingView } from '@/ui/States';
import { deviceTypes } from '../deviceTypes';
import { useRemoveDevice, useRoomDevices, useUpdateDevice } from '../hooks';

const schema = z.object({ name: z.string().trim().min(2, 'O nome deve ter ao menos 2 letras').max(80) });

export default function DeviceManageScreen() {
  const roomId = useNumericParam('roomId');
  const deviceId = useNumericParam('deviceId');
  const router = useRouter();
  const devices = useRoomDevices(roomId);

  if (devices.isPending) return <LoadingView />;
  const device = devices.data?.find((d) => d.id === deviceId);
  if (!device) {
    return (
      <EmptyState
        icon="help-circle-outline"
        title="Aparelho não encontrado"
        message="Ele pode ter sido removido ou movido para outra sala."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }
  return <DeviceForm device={device} />;
}

function DeviceForm({ device }: { device: Device }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const rooms = useRooms();
  const update = useUpdateDevice();
  const remove = useRemoveDevice();
  const [roomId, setRoomId] = useState<number | null>(device.roomId);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: device.name },
  });

  const save = handleSubmit(async ({ name }) => {
    setFormError(null);
    const body: { id: number; name?: string; roomId?: number } = { id: device.id };
    if (name.trim() !== device.name) body.name = name.trim();
    if (roomId !== null && roomId !== device.roomId) body.roomId = roomId;
    if (!body.name && !body.roomId) return router.back();
    try {
      await update.mutateAsync(body);
      toast('Aparelho atualizado.', 'success');
      router.back();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  const unregister = async () => {
    const ok = await confirm({
      title: 'Descadastrar aparelho?',
      message:
        'Ele sai da sala e das automações. Se o ESP32 continuar ligado, o aparelho volta para a lista de descobertos e pode ser cadastrado de novo.',
      confirmLabel: 'Descadastrar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(device.id);
      toast('Aparelho descadastrado.', 'success');
      router.back();
    } catch (error) {
      toast(getErrorMessage(error), 'danger');
    }
  };

  const meta = deviceTypes[device.type];

  return (
    <Screen width="form" footer={<Button label="Salvar" onPress={save} loading={update.isPending} />}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconTile name={meta.icon} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="heading">{device.name}</AppText>
            <AppText variant="caption" color="textMuted">
              {meta.label} · canal {device.channel}
            </AppText>
          </View>
        </View>
      </Card>

      {formError ? <Banner tone="danger" message={formError} /> : null}

      <Card>
        <CardHeader title="Nome" />
        <FormField control={control} name="name" label="Nome do aparelho" returnKeyType="done" onSubmitEditing={() => void save()} />
      </Card>

      <Card>
        <CardHeader title="Sala" description="Mover o aparelho para outra sala." />
        <RoomPicker rooms={rooms.data ?? []} value={roomId} onChange={setRoomId} />
      </Card>

      <Card>
        <CardHeader title="Zona de risco" description="O aparelho sai da sala e das automações." />
        <Button label="Descadastrar aparelho" variant="danger" icon="trash-outline" onPress={unregister} loading={remove.isPending} />
      </Card>
    </Screen>
  );
}
