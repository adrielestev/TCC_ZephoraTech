// src/features/rooms/screens/NewRoomScreen.tsx -- Apresenta o formulário para criar uma sala e adicionar suas fotos.
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '@/core/api/errors';
import { routes } from '@/core/navigation/routes';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { useToast } from '@/ui/Feedback';
import { FormField } from '@/ui/FormField';
import type { TextInputHandle } from '@/ui/TextField';
import { Screen } from '@/ui/Screen';
import { useCreateRoom } from '../hooks';
import { roomSchema, type RoomForm } from '../schemas';

export default function NewRoomScreen() {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateRoom();
  const [formError, setFormError] = useState<string | null>(null);
  const descriptionRef = useRef<TextInputHandle>(null);

  const { control, handleSubmit } = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: '', description: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const room = await create.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim() || null,
      });
      toast('Sala criada! Adicione fotos e cadastre os aparelhos.', 'success');
      router.replace(routes.room(room.id));
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Screen
      width="form"
      footer={<Button label="Criar sala" onPress={submit} loading={create.isPending} />}
    >
      {formError ? <Banner tone="danger" message={formError} /> : null}
      <Card>
        <CardHeader
          title="Dados da sala"
          description="Depois de criar, você adiciona fotos e cadastra os aparelhos."
        />
        <FormField
          control={control}
          name="name"
          label="Nome da sala"
          placeholder="Ex.: Sala 101"
          returnKeyType="next"
          onSubmitEditing={() => descriptionRef.current?.focus()}
        />
        <FormField
          control={control}
          name="description"
          label="Descrição (opcional)"
          inputRef={descriptionRef}
          multiline
          placeholder="Ex.: Térreo, bloco A"
        />
      </Card>
    </Screen>
  );
}
