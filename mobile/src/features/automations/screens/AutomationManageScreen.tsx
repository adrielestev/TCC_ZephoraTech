import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/core/api/errors';
import { useNumericParam } from '@/core/hooks/useNumericParam';
import type { Automation } from '@/core/types';
import { useRoomDevices } from '@/features/devices/hooks';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { useConfirm, useToast } from '@/ui/Feedback';
import { FormField } from '@/ui/FormField';
import { Screen } from '@/ui/Screen';
import { spacing } from '@/ui/theme';
import { EmptyState, LoadingView } from '@/ui/States';
import { describeLink } from '../components/AutomationCard';
import { useDeleteAutomation, useRenameAutomation, useRoomAutomations } from '../hooks';

const schema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter ao menos 2 letras').max(100),
});

export default function AutomationManageScreen() {
  const roomId = useNumericParam('roomId');
  const automationId = useNumericParam('automationId');
  const router = useRouter();
  const automations = useRoomAutomations(roomId);

  if (automations.isPending) return <LoadingView />;
  const automation = automations.data?.find((a) => a.id === automationId);
  if (!automation) {
    return (
      <EmptyState
        icon="help-circle-outline"
        title="Automação não encontrada"
        message="Ela pode ter sido excluída."
        actionLabel="Voltar"
        onAction={() => router.back()}
      />
    );
  }
  return <AutomationForm roomId={roomId} automation={automation} />;
}

function AutomationForm({ roomId, automation }: { roomId: number; automation: Automation }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const devices = useRoomDevices(roomId);
  const rename = useRenameAutomation(roomId);
  const remove = useDeleteAutomation(roomId);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: automation.name },
  });

  const save = handleSubmit(async ({ name }) => {
    setFormError(null);
    try {
      await rename.mutateAsync({ id: automation.id, name: name.trim() });
      toast('Automação salva.', 'success');
      router.back();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  const deleteAutomation = async () => {
    const ok = await confirm({
      title: 'Excluir automação?',
      message: `"${automation.name}" deixará de funcionar. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(automation.id);
      toast('Automação excluída.', 'success');
      router.back();
    } catch (error) {
      toast(getErrorMessage(error), 'danger');
    }
  };

  const list = devices.data ?? [];

  return (
    <Screen
      width="form"
      footer={<Button label="Salvar nome" onPress={save} loading={rename.isPending} />}
    >
      {formError ? <Banner tone="danger" message={formError} /> : null}

      <Card>
        <CardHeader title="Nome" />
        <FormField
          control={control}
          name="name"
          label="Nome da automação"
          returnKeyType="done"
          onSubmitEditing={() => void save()}
        />
      </Card>

      <Card>
        <CardHeader
          title="Como ela funciona"
          description="Para mudar gatilhos ou ações, exclua e crie de novo."
        />
        <View style={{ gap: spacing.xs }}>
          <AppText variant="overline" color="textMuted">
            Quando (todos precisam ser verdade)
          </AppText>
          {automation.triggers.map((t) => (
            <AppText key={t.deviceId}>• {describeLink(list, t.deviceId, t.condition)}</AppText>
          ))}
        </View>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="overline" color="textMuted">
            Então
          </AppText>
          {automation.actions.map((a) => (
            <AppText key={a.deviceId}>• {describeLink(list, a.deviceId, a.state)}</AppText>
          ))}
        </View>
        <Banner
          tone="info"
          message="A automação dispara quando o sensor muda. Se alguém apagar a luz com a presença ainda ativa, ela não liga de novo sozinha."
        />
      </Card>

      <Card>
        <CardHeader title="Zona de risco" description="A automação deixa de funcionar." />
        <Button
          label="Excluir automação"
          variant="danger"
          icon="trash-outline"
          onPress={deleteAutomation}
          loading={remove.isPending}
        />
      </Card>
    </Screen>
  );
}
