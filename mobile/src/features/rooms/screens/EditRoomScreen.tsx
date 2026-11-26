// src/features/rooms/screens/EditRoomScreen.tsx -- Carrega uma sala existente e salva alterações em seus dados e fotos.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { getErrorMessage } from '@/core/api/errors';
import { pickImage } from '@/core/api/upload';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import { qk } from '@/core/query/keys';
import type { Room } from '@/core/types';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { useConfirm, useToast } from '@/ui/Feedback';
import { FormField } from '@/ui/FormField';
import type { TextInputHandle } from '@/ui/TextField';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { QueryBoundary } from '@/ui/States';
import { colors, radius, spacing } from '@/ui/theme';
import { roomsApi } from '../api';
import { useDeleteRoom, useRoom, useUpdateRoom } from '../hooks';
import { roomSchema, type RoomForm } from '../schemas';

const SLOTS = [1, 2, 3] as const;

export default function EditRoomScreen() {
  const roomId = useNumericParam('roomId');
  const room = useRoom(roomId);
  return (
    <QueryBoundary query={room}>
      {(data) => <EditRoomForm key={data.id} room={data} />}
    </QueryBoundary>
  );
}

function EditRoomForm({ room }: { room: Room }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const update = useUpdateRoom(room.id);
  const remove = useDeleteRoom(room.id);
  const [formError, setFormError] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const descriptionRef = useRef<TextInputHandle>(null);

  const { control, handleSubmit } = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: room.name, description: room.description ?? '' },
  });

  const refreshRoom = () => {
    void qc.invalidateQueries({ queryKey: qk.room(room.id) });
    void qc.invalidateQueries({ queryKey: qk.rooms });
  };

  const photoMutation = useMutation({
    mutationFn: async ({ slot, action }: { slot: number; action: 'set' | 'remove' }) => {
      if (action === 'remove') return roomsApi.removePhoto(room.id, slot);
      const asset = await pickImage([16, 9]);
      if (!asset) return null; // cancelou
      return roomsApi.setPhoto(room.id, slot, asset);
    },
    onMutate: ({ slot }) => setBusySlot(slot),
    onSettled: () => setBusySlot(null),
    onSuccess: (result) => {
      if (result) {
        refreshRoom();
        toast('Fotos atualizadas.', 'success');
      }
    },
    onError: (error) => toast(getErrorMessage(error), 'danger'),
  });

  const save = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await update.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim() || null,
      });
      toast('Sala salva.', 'success');
      router.back();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  const deleteRoom = async () => {
    const ok = await confirm({
      title: 'Excluir sala?',
      message: `A sala "${room.name}", suas fotos, acessos e automações serão removidos. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir sala',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync();
      toast('Sala excluída.', 'success');
      router.dismissAll();
    } catch (error) {
      toast(getErrorMessage(error), 'danger');
    }
  };

  const hasDevices = room.deviceCount > 0;

  return (
    <Screen
      width="form"
      footer={<Button label="Salvar alterações" onPress={save} loading={update.isPending} />}
    >
      {formError ? <Banner tone="danger" message={formError} /> : null}

      <Card>
        <CardHeader title="Dados da sala" />
        <FormField
          control={control}
          name="name"
          label="Nome da sala"
          returnKeyType="next"
          onSubmitEditing={() => descriptionRef.current?.focus()}
        />
        <FormField
          control={control}
          name="description"
          label="Descrição (opcional)"
          inputRef={descriptionRef}
          multiline
        />
      </Card>

      <Card>
        <CardHeader
          title="Fotos da sala"
          description="Até 3 fotos. Elas aparecem na galeria da sala."
        />
        {SLOTS.map((slot) => {
          const photo = room.photos.find((p) => p.slot === slot);
          const busy = busySlot === slot;
          return (
            <View key={slot} style={styles.slot}>
              <View style={styles.preview}>
                {photo ? (
                  <Image
                    source={{ uri: photo.url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Icon name="image-outline" size={28} color="textMuted" />
                )}
              </View>
              <View style={styles.slotActions}>
                <AppText variant="label">Foto {slot}</AppText>
                <View style={styles.slotButtons}>
                  <Button
                    label={photo ? 'Trocar' : 'Adicionar'}
                    variant="outline"
                    size="sm"
                    icon="camera-outline"
                    fullWidth={false}
                    loading={busy}
                    disabled={busySlot !== null}
                    onPress={() => photoMutation.mutate({ slot, action: 'set' })}
                  />
                  {photo ? (
                    <Button
                      label="Remover"
                      variant="ghost"
                      size="sm"
                      fullWidth={false}
                      disabled={busySlot !== null}
                      onPress={() => photoMutation.mutate({ slot, action: 'remove' })}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <CardHeader
          title="Zona de risco"
          description="Excluir remove fotos, acessos e automações da sala."
        />
        {hasDevices ? (
          <Banner
            tone="warning"
            message={`Esta sala ainda tem ${room.deviceCount} aparelho(s). Mova ou remova os aparelhos antes de excluir.`}
          />
        ) : null}
        <Button
          label="Excluir sala"
          variant="danger"
          icon="trash-outline"
          onPress={deleteRoom}
          loading={remove.isPending}
          disabled={hasDevices}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slot: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  preview: {
    width: 128,
    height: 72,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotActions: { flex: 1, gap: spacing.sm },
  slotButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
